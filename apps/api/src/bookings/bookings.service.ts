import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@shuttle/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RequestUser, assertOwnerOrAdmin } from '../auth/request-user';

/**
 * Nota de vocabulario: de cara al cliente una "booking" es la compra entera,
 * y eso es una Reservation. El modelo Booking es un TRAMO (una salida
 * concreta). Los endpoints siguen en /bookings porque es la palabra que ve
 * el usuario; adentro siempre se trabaja con Reservation.
 */

const HOLD_MINUTES = 10;

/** Piso de una salida compartida: por debajo, no cubre el costo del vehiculo */
const SHARED_MIN_PASSENGERS = 3;

/** Estados que ocupan asiento */
const ACTIVE_STATUSES: Prisma.EnumBookingStatusFilter = {
  in: ['PENDING', 'CONFIRMED'],
};

const NOT_YOURS = 'No tienes acceso a esta reserva';

const RESERVATION_INCLUDE = {
  // OUTBOUND antes que RETURN
  legs: {
    include: { trip: { include: { route: true } } },
    orderBy: { direction: 'asc' as const },
  },
  payment: true,
};

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cancela las reservas PENDING vencidas que ocupan asiento en este viaje.
   * Libera plazas retenidas por pagos que nunca se completaron.
   */
  private async releaseExpiredHolds(
    tx: Prisma.TransactionClient,
    tripId: string,
  ) {
    await tx.reservation.updateMany({
      where: {
        status: 'PENDING',
        heldUntil: { lt: new Date() },
        legs: { some: { tripId } },
      },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Recalcula trip.bookedSeats sumando los tramos activos reales.
   *
   * Se deriva de los tramos en vez de sumar y restar sobre el valor anterior:
   * cualquier operacion perdida (un hold vencido, una cancelacion repetida)
   * se autocorrige aca.
   */
  private async syncBookedSeats(
    tx: Prisma.TransactionClient,
    tripId: string,
  ): Promise<number> {
    const active = await tx.booking.aggregate({
      where: { tripId, reservation: { status: ACTIVE_STATUSES } },
      _sum: { passengers: true },
    });

    const bookedSeats = active._sum.passengers || 0;

    await tx.trip.update({
      where: { id: tripId },
      data: { bookedSeats },
    });

    return bookedSeats;
  }

  /**
   * Asientos CONFIRMED de una salida.
   *
   * Deliberadamente distinto de los asientos activos: la habilitacion del
   * minimo compartido no puede apoyarse en holds PENDING, porque vencen a los
   * HOLD_MINUTES y dejarian a un pasajero solo pagando tarifa de grupo.
   */
  private async confirmedSeats(
    tx: Prisma.TransactionClient,
    tripId: string,
  ): Promise<number> {
    const confirmed = await tx.booking.aggregate({
      where: { tripId, reservation: { status: 'CONFIRMED' } },
      _sum: { passengers: true },
    });

    return confirmed._sum.passengers || 0;
  }

  /**
   * Valida un tramo y devuelve cuanto cuesta y cuantos asientos ocupa.
   *
   * PRIVATE toma el vehiculo entero. SHARED exige SHARED_MIN_PASSENGERS
   * mientras la salida no tenga ese piso ya confirmado por otros.
   */
  private async priceLeg(
    tx: Prisma.TransactionClient,
    tripId: string,
    dto: CreateBookingDto,
    label: string,
  ) {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { route: true },
    });

    if (!trip) throw new NotFoundException(`Viaje no encontrado (${label})`);
    if (trip.status !== 'SCHEDULED') {
      throw new BadRequestException(`Este viaje no está disponible (${label})`);
    }

    await this.releaseExpiredHolds(tx, tripId);

    const isPrivate = dto.type === 'PRIVATE';
    const seats = isPrivate ? trip.capacity : dto.passengers;

    if (!isPrivate) {
      const confirmed = await this.confirmedSeats(tx, tripId);
      if (
        confirmed < SHARED_MIN_PASSENGERS &&
        dto.passengers < SHARED_MIN_PASSENGERS
      ) {
        throw new BadRequestException(
          `Esta salida todavía no tiene ${SHARED_MIN_PASSENGERS} pasajeros confirmados (${label}). ` +
            `Puedes abrirla reservando ${SHARED_MIN_PASSENGERS} plazas, o elegir un transfer privado.`,
        );
      }
    }

    const active = await tx.booking.aggregate({
      where: { tripId, reservation: { status: ACTIVE_STATUSES } },
      _sum: { passengers: true },
    });
    const availableSeats = trip.capacity - (active._sum.passengers || 0);

    if (availableSeats < seats) {
      throw new ConflictException(
        `Solo quedan ${availableSeats} asientos disponibles (${label})`,
      );
    }

    const amount = isPrivate
      ? Number(trip.pricePrivate)
      : Number(trip.priceShared) * dto.passengers;

    return { trip, seats, amount };
  }

  async create(userId: string, dto: CreateBookingDto) {
    return this.prisma.$transaction(async (tx) => {
      const isRoundTrip = !!dto.returnTripId;

      if (isRoundTrip && dto.returnTripId === dto.tripId) {
        throw new BadRequestException(
          'El regreso no puede ser la misma salida que la ida',
        );
      }

      const outbound = await this.priceLeg(tx, dto.tripId, dto, 'ida');

      let inbound: Awaited<ReturnType<typeof this.priceLeg>> | null = null;
      if (isRoundTrip) {
        inbound = await this.priceLeg(tx, dto.returnTripId!, dto, 'regreso');

        if (inbound.trip.departureAt <= outbound.trip.departureAt) {
          throw new BadRequestException(
            'El regreso debe salir después de la ida',
          );
        }

        // El regreso tiene que deshacer el camino de la ida
        if (inbound.trip.route.origin !== outbound.trip.route.destination) {
          throw new BadRequestException(
            `El regreso debe salir desde ${outbound.trip.route.destination}`,
          );
        }
      }

      const totalAmount = outbound.amount + (inbound?.amount ?? 0);

      const heldUntil = new Date();
      heldUntil.setMinutes(heldUntil.getMinutes() + HOLD_MINUTES);

      const reservation = await tx.reservation.create({
        data: {
          userId,
          type: dto.type,
          tripType: isRoundTrip ? 'ROUND_TRIP' : 'ONE_WAY',
          passengers: dto.passengers,
          totalAmount,
          heldUntil,
          notes: dto.notes,
          status: 'PENDING',
          legs: {
            create: [
              {
                tripId: dto.tripId,
                direction: 'OUTBOUND',
                passengers: outbound.seats,
                amount: outbound.amount,
              },
              ...(inbound
                ? [
                    {
                      tripId: dto.returnTripId!,
                      direction: 'RETURN' as const,
                      passengers: inbound.seats,
                      amount: inbound.amount,
                    },
                  ]
                : []),
            ],
          },
        },
        include: RESERVATION_INCLUDE,
      });

      await this.syncBookedSeats(tx, dto.tripId);
      if (isRoundTrip) await this.syncBookedSeats(tx, dto.returnTripId!);

      return {
        ...reservation,
        minutesToPay: HOLD_MINUTES,
        message: `Tienes ${HOLD_MINUTES} minutos para completar el pago`,
      };
    });
  }

  async findByUser(userId: string, user: RequestUser) {
    assertOwnerOrAdmin(userId, user, NOT_YOURS);

    return this.prisma.reservation.findMany({
      where: { userId },
      include: RESERVATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: RequestUser) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: RESERVATION_INCLUDE,
    });

    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    assertOwnerOrAdmin(reservation.userId, user, NOT_YOURS);

    return reservation;
  }

  async cancel(id: string, user: RequestUser) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
        include: { legs: { select: { tripId: true } } },
      });

      if (!reservation) throw new NotFoundException('Reserva no encontrada');
      assertOwnerOrAdmin(reservation.userId, user, NOT_YOURS);

      if (reservation.status === 'CONFIRMED') {
        throw new BadRequestException(
          'No se puede cancelar una reserva confirmada. Contacta soporte.',
        );
      }

      // Idempotente: si el hold ya vencio y se cancelo solo, no volvemos a
      // liberar los mismos asientos
      if (reservation.status === 'CANCELLED') {
        return { message: 'La reserva ya estaba cancelada' };
      }

      await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Se liberan los asientos de todos los tramos, no solo de la ida
      for (const leg of reservation.legs) {
        await this.syncBookedSeats(tx, leg.tripId);
      }

      return { message: 'Reserva cancelada correctamente' };
    });
  }

  async confirm(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    if (reservation.status !== 'PENDING') {
      throw new BadRequestException('La reserva no está en estado pendiente');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CONFIRMED', heldUntil: null },
      include: RESERVATION_INCLUDE,
    });
  }

  async findAllBookings() {
    return this.prisma.reservation.findMany({
      include: {
        ...RESERVATION_INCLUDE,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
