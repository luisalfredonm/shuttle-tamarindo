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

const HOLD_MINUTES = 10;

const ACTIVE_STATUSES: Prisma.EnumBookingStatusFilter = {
  in: ['PENDING', 'CONFIRMED'],
};

const NOT_YOURS = 'No tienes acceso a esta reserva';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cancela los holds PENDING ya vencidos de un viaje.
   * Libera asientos que quedaron retenidos por pagos que nunca se completaron.
   */
  private async releaseExpiredHolds(
    tx: Prisma.TransactionClient,
    tripId: string,
  ) {
    await tx.booking.updateMany({
      where: {
        tripId,
        status: 'PENDING',
        heldUntil: { lt: new Date() },
      },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Recalcula trip.bookedSeats sumando las reservas activas reales.
   *
   * Es un contador denormalizado, así que se deriva siempre de las reservas
   * en vez de sumar/restar sobre el valor anterior: cualquier operación
   * perdida (un hold vencido, una cancelación repetida) se autocorrige aquí.
   */
  private async syncBookedSeats(
    tx: Prisma.TransactionClient,
    tripId: string,
  ): Promise<number> {
    const active = await tx.booking.aggregate({
      where: { tripId, status: ACTIVE_STATUSES },
      _sum: { passengers: true },
    });

    const bookedSeats = active._sum.passengers || 0;

    await tx.trip.update({
      where: { id: tripId },
      data: { bookedSeats },
    });

    return bookedSeats;
  }

  async create(userId: string, dto: CreateBookingDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener el viaje con lock
      const trip = await tx.trip.findUnique({
        where: { id: dto.tripId },
        include: { route: true },
      });

      if (!trip) throw new NotFoundException('Viaje no encontrado');
      if (trip.status !== 'SCHEDULED') {
        throw new BadRequestException('Este viaje no está disponible');
      }

      // 2. Limpiar holds vencidos
      await this.releaseExpiredHolds(tx, dto.tripId);

      // 3. Recalcular asientos reales disponibles
      const activeBookings = await tx.booking.aggregate({
        where: {
          tripId: dto.tripId,
          status: ACTIVE_STATUSES,
        },
        _sum: { passengers: true },
      });

      const bookedSeats = activeBookings._sum.passengers || 0;
      const availableSeats = trip.capacity - bookedSeats;

      const seatsNeeded =
        dto.type === 'PRIVATE' ? trip.capacity : dto.passengers;

      if (availableSeats < seatsNeeded) {
        throw new ConflictException(
          `Solo quedan ${availableSeats} asientos disponibles`,
        );
      }

      // 4. Calcular precio
      const totalAmount =
        dto.type === 'PRIVATE'
          ? Number(trip.pricePrivate)
          : Number(trip.priceShared) * dto.passengers;

      // 5. Crear booking con hold de 10 minutos
      const heldUntil = new Date();
      heldUntil.setMinutes(heldUntil.getMinutes() + HOLD_MINUTES);

      const booking = await tx.booking.create({
        data: {
          tripId: dto.tripId,
          userId,
          type: dto.type,
          passengers: seatsNeeded,
          totalAmount,
          heldUntil,
          notes: dto.notes,
          status: 'PENDING',
        },
        include: {
          trip: { include: { route: true } },
        },
      });

      // 6. Actualizar contador de asientos en el trip
      await this.syncBookedSeats(tx, dto.tripId);

      return {
        ...booking,
        totalAmount,
        heldUntil,
        minutesToPay: HOLD_MINUTES,
        message: `Tienes ${HOLD_MINUTES} minutos para completar el pago`,
      };
    });
  }

  async findByUser(userId: string, user: RequestUser) {
    assertOwnerOrAdmin(userId, user, NOT_YOURS);

    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        trip: { include: { route: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: RequestUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        trip: { include: { route: true } },
        payment: true,
      },
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    assertOwnerOrAdmin(booking.userId, user, NOT_YOURS);

    return booking;
  }

  async cancel(id: string, user: RequestUser) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });

      if (!booking) throw new NotFoundException('Reserva no encontrada');
      assertOwnerOrAdmin(booking.userId, user, NOT_YOURS);

      if (booking.status === 'CONFIRMED') {
        throw new BadRequestException(
          'No se puede cancelar una reserva confirmada. Contacta soporte.',
        );
      }

      // Idempotente: si el hold ya vencio y se cancelo solo, no volvemos a
      // liberar los mismos asientos (antes esto descontaba dos veces)
      if (booking.status === 'CANCELLED') {
        return { message: 'La reserva ya estaba cancelada' };
      }

      await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Liberar asientos recalculando desde las reservas activas
      await this.syncBookedSeats(tx, booking.tripId);

      return { message: 'Reserva cancelada correctamente' };
    });
  }

  async confirm(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (booking.status !== 'PENDING') {
      throw new BadRequestException('La reserva no está en estado pendiente');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED', heldUntil: null },
      include: {
        trip: { include: { route: true } },
        payment: true,
      },
    });
  }

  async findAllBookings() {
    return this.prisma.booking.findMany({
      include: {
        trip: { include: { route: true } },
        payment: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
