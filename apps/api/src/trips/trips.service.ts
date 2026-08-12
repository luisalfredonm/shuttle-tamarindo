import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';

/** Debe coincidir con SHARED_MIN_PASSENGERS de BookingsService */
const SHARED_MIN_PASSENGERS = 3;

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Asientos CONFIRMED por viaje.
   *
   * Se expone aparte de bookedSeats (que incluye holds PENDING) porque es lo
   * que habilita a un pasajero suelto a sumarse a un compartido: la web
   * necesita el dato para decir "unite" o "abrila" antes de que el usuario
   * llene el formulario y se lleve el rechazo.
   */
  private async confirmedSeatsByTrip(
    tripIds: string[],
  ): Promise<Map<string, number>> {
    if (tripIds.length === 0) return new Map();

    const rows = await this.prisma.booking.groupBy({
      by: ['tripId'],
      where: { tripId: { in: tripIds }, reservation: { status: 'CONFIRMED' } },
      _sum: { passengers: true },
    });

    return new Map(rows.map((r) => [r.tripId, r._sum.passengers || 0]));
  }

  async findAll(query: QueryTripsDto) {
    // Los Trips ad-hoc de un privado no son una opcion de compartido:
    // son el vehiculo exclusivo de una reserva puntual, no un horario
    const where: any = { source: 'SCHEDULED' };

    if (query.routeId) {
      where.routeId = query.routeId;
    }

    if (query.routeSlug) {
      where.route = { slug: query.routeSlug };
    }

    if (query.date) {
      const [year, month, day] = query.date.split('-').map(Number);
      const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      where.departureAt = { gte: start, lte: end };
    } else {
      where.departureAt = { gte: new Date() };
    }

    const trips = await this.prisma.trip.findMany({
      where,
      include: { route: true },
      orderBy: { departureAt: 'asc' },
    });

    const confirmed = await this.confirmedSeatsByTrip(trips.map((t) => t.id));

    return trips.map((trip) => {
      const confirmedSeats = confirmed.get(trip.id) || 0;
      return {
        ...trip,
        availableSeats: trip.capacity - trip.bookedSeats,
        isFull: trip.bookedSeats >= trip.capacity,
        occupancyPercent: Math.round((trip.bookedSeats / trip.capacity) * 100),
        confirmedSeats,
        sharedMinPassengers: SHARED_MIN_PASSENGERS,
        // false => un pasajero suelto todavia no puede sumarse a esta salida
        sharedOpen: confirmedSeats >= SHARED_MIN_PASSENGERS,
      };
    });
  }

  async findById(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: { route: true },
    });

    if (!trip) throw new NotFoundException(`Viaje no encontrado`);

    const confirmedSeats = (await this.confirmedSeatsByTrip([id])).get(id) || 0;

    return {
      ...trip,
      availableSeats: trip.capacity - trip.bookedSeats,
      isFull: trip.bookedSeats >= trip.capacity,
      occupancyPercent: Math.round((trip.bookedSeats / trip.capacity) * 100),
      confirmedSeats,
      sharedMinPassengers: SHARED_MIN_PASSENGERS,
      sharedOpen: confirmedSeats >= SHARED_MIN_PASSENGERS,
    };
  }

  async create(dto: CreateTripDto) {
    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
    });

    if (!route) throw new NotFoundException(`Ruta no encontrada`);

    return this.prisma.trip.create({
      data: {
        routeId: dto.routeId,
        departureAt: new Date(dto.departureAt),
        capacity: dto.capacity || 10,
        priceShared: dto.priceShared,
      },
      include: { route: true },
    });
  }

  async update(id: string, dto: UpdateTripDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException(`Viaje no encontrado`);
    return this.prisma.trip.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.departureAt && { departureAt: new Date(dto.departureAt) }),
      },
      include: { route: true },
    });
  }

  async remove(id: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException(`Viaje no encontrado`);
    await this.prisma.trip.delete({ where: { id } });
    return { message: 'Viaje eliminado' };
  }

  async seed() {
    const routes = await this.prisma.route.findMany({
      where: { isActive: true },
    });

    if (routes.length === 0) {
      throw new BadRequestException('Primero ejecuta el seed de rutas');
    }

    // Solo compartido: privado ya no tiene horarios precargados, el cliente
    // elige cualquier hora y el precio sale de route.pricePrivate
    const pricesShared: Record<string, number> = {
      'tamarindo-liberia-airport': 30,
      'liberia-airport-tamarindo': 30,
      'tamarindo-arenal': 55,
      'tamarindo-monteverde': 45,
      'tamarindo-san-jose': 65,
      'tamarindo-nosara': 35,
    };

    const hours = [9, 14, 18];
    const daysAhead = 30;
    let created = 0;

    for (const route of routes) {
      const priceShared = pricesShared[route.slug] || 35;

      for (let day = 1; day <= daysAhead; day++) {
        for (const hour of hours) {
          const departureAt = new Date();
          departureAt.setDate(departureAt.getDate() + day);
          departureAt.setUTCHours(hour, 0, 0, 0);

          const exists = await this.prisma.trip.findFirst({
            where: { routeId: route.id, departureAt },
          });

          if (!exists) {
            await this.prisma.trip.create({
              data: {
                routeId: route.id,
                departureAt,
                capacity: 10,
                priceShared,
              },
            });
            created++;
          }
        }
      }
    }

    return {
      message: `${created} viajes creados para los próximos ${daysAhead} días`,
    };
  }
}
