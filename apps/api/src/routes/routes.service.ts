import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.route.findMany({
      where: { isActive: true },
      orderBy: { origin: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const route = await this.prisma.route.findUnique({
      where: { slug },
      include: {
        trips: {
          where: {
            departureAt: { gte: new Date() },
            status: 'SCHEDULED',
          },
          orderBy: { departureAt: 'asc' },
          take: 10,
        },
      },
    });

    if (!route) throw new NotFoundException(`Ruta "${slug}" no encontrada`);
    return route;
  }

  async create(dto: CreateRouteDto) {
    return this.prisma.route.create({ data: dto });
  }

  async seed() {
    const routes = [
      {
        slug: 'tamarindo-liberia-airport',
        origin: 'Tamarindo',
        destination: 'Aeropuerto Liberia (LIR)',
        durationMin: 90,
        distanceKm: 78,
      },
      {
        slug: 'liberia-airport-tamarindo',
        origin: 'Aeropuerto Liberia (LIR)',
        destination: 'Tamarindo',
        durationMin: 90,
        distanceKm: 78,
      },
      {
        slug: 'tamarindo-arenal',
        origin: 'Tamarindo',
        destination: 'Arenal',
        durationMin: 240,
        distanceKm: 210,
      },
      {
        slug: 'tamarindo-monteverde',
        origin: 'Tamarindo',
        destination: 'Monteverde',
        durationMin: 180,
        distanceKm: 150,
      },
      {
        slug: 'tamarindo-san-jose',
        origin: 'Tamarindo',
        destination: 'San José',
        durationMin: 300,
        distanceKm: 290,
      },
      {
        slug: 'tamarindo-nosara',
        origin: 'Tamarindo',
        destination: 'Nosara',
        durationMin: 120,
        distanceKm: 95,
      },
    ];

    for (const route of routes) {
      await this.prisma.route.upsert({
        where: { slug: route.slug },
        update: {},
        create: route,
      });
    }

    return { message: `${routes.length} rutas creadas correctamente` };
  }
}
