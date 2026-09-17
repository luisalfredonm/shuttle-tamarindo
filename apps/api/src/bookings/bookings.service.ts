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
import {
  NO_ACCESS,
  assertCanAccessReservation,
  newAccessToken,
} from './reservation-access';
import { TurnstileService } from './turnstile.service';
import { EmailService } from '../email/email.service';
import { LookupBookingsDto } from './dto/lookup-bookings.dto';

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

const NOT_YOURS = NO_ACCESS;

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
  constructor(
    private prisma: PrismaService,
    private turnstile: TurnstileService,
    private email: EmailService,
  ) {}

  /**
   * "Encuentra mi reserva": manda por correo los enlaces de las reservas de
   * ese email.
   *
   * La respuesta es siempre la misma, exista o no el correo: si dijera "no hay
   * reservas", esta pantalla serviria para averiguar quien compro. Los enlaces
   * van al buzon, que es lo unico que prueba que el correo es suyo.
   */
  async sendMyBookings(dto: LookupBookingsDto, ip?: string) {
    const ALWAYS = {
      message:
        'If that email has bookings, we just sent you a link to each one.',
    };

    await this.turnstile.verify(dto.turnstileToken, ip);

    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return ALWAYS;

    // Solo lo que el cliente todavia puede usar: activas y a futuro. Una
    // reserva cancelada o de un viaje que ya paso no tiene nada que abrir.
    const reservations = await this.prisma.reservation.findMany({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        accessToken: { not: null },
        legs: { some: { trip: { departureAt: { gte: new Date() } } } },
      },
      include: RESERVATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (reservations.length === 0) return ALWAYS;

    await this.email.sendBookingLinks(
      user.email,
      // El contacto de la compra mas reciente describe mejor a quien escribe
      reservations[0].contactName ?? user.name,
      reservations.map((reservation) => {
        const leg =
          reservation.legs.find((l) => l.direction === 'OUTBOUND') ??
          reservation.legs[0];

        return {
          bookingId: reservation.id,
          accessToken: reservation.accessToken!,
          status: reservation.status,
          amount: Number(reservation.totalAmount),
          outbound: {
            direction: leg.direction,
            origin: leg.trip.route.origin,
            destination: leg.trip.route.destination,
            departure: leg.trip.departureAt,
            durationMin: leg.trip.route.durationMin,
          },
        };
      }),
    );

    return ALWAYS;
  }

  /**
   * Cliente al que se le cuelga una reserva sin sesion.
   *
   * Si el email ya tiene cuenta la reserva se le adjunta, pero no se toca su
   * nombre ni su contrasena: el email no se verifica, asi que un invitado no
   * puede modificar la cuenta de otro. Los datos de contacto de esta compra
   * viven en la reserva (contactName / contactPhone).
   */
  private async resolveGuestUserId(
    tx: Prisma.TransactionClient,
    guest: { name: string; email: string; phone: string },
  ): Promise<string> {
    const email = guest.email.trim().toLowerCase();

    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      // Sin contrasena no hay cuenta que proteger: se refrescan sus datos
      if (!existing.password) {
        await tx.user.update({
          where: { id: existing.id },
          data: { name: guest.name, phone: guest.phone },
        });
      }
      return existing.id;
    }

    const created = await tx.user.create({
      data: {
        email,
        name: guest.name,
        phone: guest.phone,
        // Sin contrasena: no se puede iniciar sesion con esta cuenta hasta
        // que la persona se registre con este mismo correo
        password: '',
        role: 'CUSTOMER',
      },
    });
    return created.id;
  }

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
      ? Number(trip.route.pricePrivate)
      : Number(trip.priceShared) * dto.passengers;

    return { trip, seats, amount };
  }

  /**
   * SHARED elige un horario ya precargado: llega con tripId.
   * PRIVATE elige cualquier hora: llega con routeSlug + departureAt, y acá
   * se busca o se crea al vuelo el Trip puntual para esa salida (nadie más
   * la va a compartir, es un vehículo exclusivo).
   */
  private async resolveTripId(
    tx: Prisma.TransactionClient,
    type: CreateBookingDto['type'],
    tripId: string | undefined,
    routeSlug: string | undefined,
    departureAt: string | undefined,
    label: string,
  ): Promise<string> {
    if (type === 'SHARED') {
      if (!tripId) throw new BadRequestException(`Falta el viaje (${label})`);
      return tripId;
    }

    if (!routeSlug || !departureAt) {
      throw new BadRequestException(
        `Falta la ruta o la hora del transfer privado (${label})`,
      );
    }

    const route = await tx.route.findUnique({ where: { slug: routeSlug } });
    if (!route) throw new NotFoundException(`Ruta no encontrada (${label})`);

    const parsedDepartureAt = new Date(departureAt);

    // Cada privado estrena su propio Trip, sin reutilizar ninguno existente.
    //
    // Antes se buscaba cualquier viaje a esa hora y se tomaba entero, con dos
    // efectos malos. Si coincidia con una salida compartida, el privado la
    // ocupaba y esa salida desaparecia del inventario publico: se vendia un
    // vehiculo y se perdian los asientos de todo un horario. Y si ya habia
    // otro privado a la misma hora, el segundo cliente chocaba con el vehiculo
    // del primero y la reserva fallaba, cuando en realidad son dos vehiculos
    // distintos y la venta era posible.
    const created = await tx.trip.create({
      data: {
        routeId: route.id,
        departureAt: parsedDepartureAt,
        // priceShared no aplica a un privado ad-hoc, pero la columna es NOT NULL
        priceShared: 0,
        // No debe aparecer en la lista de compartido: es un vehiculo
        // exclusivo de esta reserva, a una hora que nadie mas eligio
        source: 'ON_DEMAND',
      },
    });
    return created.id;
  }

  /**
   * Reserva con o sin sesion.
   *
   * Sin sesion (`user` undefined) hacen falta nombre, email y telefono: el
   * conductor necesita a quien llamar y el cliente su comprobante. La reserva
   * se marca bookedAsGuest y se accede con su enlace secreto.
   */
  async create(
    user: RequestUser | undefined,
    dto: CreateBookingDto,
    ip?: string,
  ) {
    const isGuest = !user;

    if (isGuest) {
      if (
        !dto.guestName?.trim() ||
        !dto.guestEmail?.trim() ||
        !dto.guestPhone?.trim()
      ) {
        throw new BadRequestException(
          'Falta el nombre, el email o el telefono de contacto',
        );
      }
      // Antes de tocar la base: un bot no deberia ni llegar a crear el Trip
      await this.turnstile.verify(dto.turnstileToken, ip);
    }

    return this.prisma.$transaction(async (tx) => {
      const userId = user
        ? user.id
        : await this.resolveGuestUserId(tx, {
            name: dto.guestName!.trim(),
            email: dto.guestEmail!.trim(),
            phone: dto.guestPhone!.trim(),
          });
      const tripId = await this.resolveTripId(
        tx,
        dto.type,
        dto.tripId,
        dto.routeSlug,
        dto.departureAt,
        'ida',
      );

      const isRoundTrip =
        dto.type === 'PRIVATE'
          ? !!(dto.returnRouteSlug && dto.returnDepartureAt)
          : !!dto.returnTripId;

      let returnTripId: string | undefined;
      if (isRoundTrip) {
        returnTripId = await this.resolveTripId(
          tx,
          dto.type,
          dto.returnTripId,
          dto.returnRouteSlug,
          dto.returnDepartureAt,
          'regreso',
        );

        if (returnTripId === tripId) {
          throw new BadRequestException(
            'El regreso no puede ser la misma salida que la ida',
          );
        }
      }

      const outbound = await this.priceLeg(tx, tripId, dto, 'ida');

      let inbound: Awaited<ReturnType<typeof this.priceLeg>> | null = null;
      if (isRoundTrip) {
        inbound = await this.priceLeg(tx, returnTripId!, dto, 'regreso');

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
          accessToken: newAccessToken(),
          bookedAsGuest: isGuest,
          contactName: isGuest ? dto.guestName!.trim() : null,
          contactPhone: isGuest ? dto.guestPhone!.trim() : null,
          type: dto.type,
          tripType: isRoundTrip ? 'ROUND_TRIP' : 'ONE_WAY',
          passengers: dto.passengers,
          totalAmount,
          heldUntil,
          notes: dto.notes,
          flightNumber: dto.flightNumber,
          pickupAddress: dto.pickupAddress,
          agreementSignedName: dto.agreementSignedName,
          agreementSignedAt: new Date(),
          status: 'PENDING',
          legs: {
            create: [
              {
                tripId,
                direction: 'OUTBOUND',
                passengers: outbound.seats,
                amount: outbound.amount,
              },
              ...(inbound
                ? [
                    {
                      tripId: returnTripId!,
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

      await this.syncBookedSeats(tx, tripId);
      if (isRoundTrip) await this.syncBookedSeats(tx, returnTripId!);

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
      // Las de invitado quedan fuera a proposito: se ven con su enlace, no
      // por tener una cuenta con el mismo correo
      where: {
        userId,
        ...(user.role === 'ADMIN' ? {} : { bookedAsGuest: false }),
      },
      include: RESERVATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user?: RequestUser, token?: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: RESERVATION_INCLUDE,
    });

    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    assertCanAccessReservation(reservation, user, token);

    return reservation;
  }

  async cancel(id: string, user?: RequestUser, token?: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
        include: { legs: { select: { tripId: true } } },
      });

      if (!reservation) throw new NotFoundException('Reserva no encontrada');
      assertCanAccessReservation(reservation, user, token);

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
    const reservations = await this.prisma.reservation.findMany({
      include: {
        ...RESERVATION_INCLUDE,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // El panel muestra a quien recoger: en las de invitado eso es el contacto
    // de la compra, no el nombre guardado en la cuenta del correo
    return reservations.map((reservation) => ({
      ...reservation,
      user: {
        ...reservation.user,
        name: reservation.contactName ?? reservation.user.name,
        phone: reservation.contactPhone ?? reservation.user.phone,
      },
    }));
  }
}
