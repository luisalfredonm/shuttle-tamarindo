import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryTripsDto) {
    const where: any = { status: 'SCHEDULED' };

    if (query.routeId) {
      where.routeId = query.routeId;
    }

    if (query.routeSlug) {
      where.route = { slug: query.routeSlug };
    }

    if (query.date) {
      const [year, month, day] = query.date.split('-').map(Number);
      const start = new Date(year, month - 1, day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(year, month - 1, day);
      end.setHours(23, 59, 59, 999);
      where.departureAt = { gte: start, lte: end };
    } else {
      where.departureAt = { gte: new Date() };
    }

    const trips = await this.prisma.trip.findMany({
      where,
      include: { route: true },
      orderBy: { departureAt: 'asc' },
    });

    return trips.map((trip) => ({
      ...trip,
      availableSeats: trip.capacity - trip.bookedSeats,
      isFull: trip.bookedSeats >= trip.capacity,
      occupancyPercent: Math.round((trip.bookedSeats / trip.capacity) * 100),
    }));
  }

  async findById(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: { route: true },
    });

    if (!trip) throw new NotFoundException(`Viaje no encontrado`);

    return {
      ...trip,
      availableSeats: trip.capacity - trip.bookedSeats,
      isFull: trip.bookedSeats >= trip.capacity,
      occupancyPercent: Math.round((trip.bookedSeats / trip.capacity) * 100),
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
        pricePrivate: dto.pricePrivate,
      },
      include: { route: true },
    });
  }

  async seed() {
    const routes = await this.prisma.route.findMany({
      where: { isActive: true },
    });

    if (routes.length === 0) {
      throw new BadRequestException('Primero ejecuta el seed de rutas');
    }

    const prices: Record<string, { shared: number; private: number }> = {
      'tamarindo-liberia-airport': { shared: 30, private: 120 },
      'liberia-airport-tamarindo': { shared: 30, private: 120 },
      'tamarindo-arenal': { shared: 55, private: 220 },
      'tamarindo-monteverde': { shared: 45, private: 180 },
      'tamarindo-san-jose': { shared: 65, private: 260 },
      'tamarindo-nosara': { shared: 35, private: 140 },
    };

    const hours = [9, 14, 18];
    const daysAhead = 30;
    let created = 0;

    for (const route of routes) {
      const price = prices[route.slug] || { shared: 35, private: 140 };

      for (let day = 1; day <= daysAhead; day++) {
        for (const hour of hours) {
          const departureAt = new Date();
          departureAt.setDate(departureAt.getDate() + day);
          departureAt.setHours(hour, 0, 0, 0);

          await this.prisma.trip.create({
            data: {
              routeId: route.id,
              departureAt,
              capacity: 10,
              priceShared: price.shared,
              pricePrivate: price.private,
            },
          });
          created++;
        }
      }
    }

    return {
      message: `${created} viajes creados para los próximos ${daysAhead} días`,
    };
  }
}
