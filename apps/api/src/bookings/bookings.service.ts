import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const HOLD_MINUTES = 10;

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
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
      await tx.booking.updateMany({
        where: {
          tripId: dto.tripId,
          status: 'PENDING',
          heldUntil: { lt: new Date() },
        },
        data: { status: 'CANCELLED' },
      });

      // 3. Recalcular asientos reales disponibles
      const activeBookings = await tx.booking.aggregate({
        where: {
          tripId: dto.tripId,
          status: { in: ['PENDING', 'CONFIRMED'] },
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
          userId: dto.userId,
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
      await tx.trip.update({
        where: { id: dto.tripId },
        data: { bookedSeats: bookedSeats + seatsNeeded },
      });

      return {
        ...booking,
        totalAmount,
        heldUntil,
        minutesToPay: HOLD_MINUTES,
        message: `Tienes ${HOLD_MINUTES} minutos para completar el pago`,
      };
    });
  }

  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        trip: { include: { route: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        trip: { include: { route: true } },
        payment: true,
      },
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    return booking;
  }

  async cancel(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (booking.status === 'CONFIRMED') {
      throw new BadRequestException(
        'No se puede cancelar una reserva confirmada. Contacta soporte.',
      );
    }

    // Liberar asientos
    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.trip.update({
        where: { id: booking.tripId },
        data: {
          bookedSeats: { decrement: booking.passengers },
        },
      }),
    ]);

    return { message: 'Reserva cancelada correctamente' };
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
