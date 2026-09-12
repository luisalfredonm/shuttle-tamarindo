import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Rutas para la web y para el panel.
   *
   * Cada ruta viene con sharedEnabled, que dice si tiene horarios activos: es
   * lo que separa "se vende compartido" de "solo privado". El privado no
   * depende de esto, alcanza con que la ruta exista y este activa.
   *
   * activeOnly lo usa la web, que no debe ofrecer rutas apagadas. El panel
   * llama sin el filtro porque necesita verlas para poder reactivarlas.
   */
  async findAll(activeOnly = false) {
    const routes = await this.prisma.route.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { origin: 'asc' },
      include: {
        schedules: {
          where: { isActive: true },
          select: { departureTime: true, priceShared: true },
          orderBy: { departureTime: 'asc' },
        },
      },
    });

    return routes.map(({ schedules, ...route }) => ({
      ...route,
      ...summarizeSchedules(schedules),
    }));
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
        schedules: {
          where: { isActive: true },
          select: { departureTime: true, priceShared: true },
          orderBy: { departureTime: 'asc' },
        },
      },
    });

    if (!route) throw new NotFoundException(`Ruta "${slug}" no encontrada`);

    const { schedules, ...rest } = route;
    return { ...rest, ...summarizeSchedules(schedules) };
  }

  async create(dto: CreateRouteDto) {
    return this.prisma.route.create({ data: dto });
  }

  async update(id: string, dto: UpdateRouteDto) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException(`Ruta no encontrada`);
    return this.prisma.route.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException(`Ruta no encontrada`);
    await this.prisma.route.delete({ where: { id } });
    return { message: 'Ruta eliminada' };
  }

  async seed() {
    const routes = [
      {
        slug: 'tamarindo-liberia-airport',
        origin: 'Tamarindo',
        destination: 'Aeropuerto Liberia (LIR)',
        durationMin: 90,
        distanceKm: 78,
        pricePrivate: 120,
      },
      {
        slug: 'liberia-airport-tamarindo',
        origin: 'Aeropuerto Liberia (LIR)',
        destination: 'Tamarindo',
        durationMin: 90,
        distanceKm: 78,
        pricePrivate: 120,
      },
      {
        slug: 'tamarindo-arenal',
        origin: 'Tamarindo',
        destination: 'Arenal',
        durationMin: 240,
        distanceKm: 210,
        pricePrivate: 220,
      },
      {
        slug: 'tamarindo-monteverde',
        origin: 'Tamarindo',
        destination: 'Monteverde',
        durationMin: 180,
        distanceKm: 150,
        pricePrivate: 180,
      },
      {
        slug: 'tamarindo-san-jose',
        origin: 'Tamarindo',
        destination: 'San José',
        durationMin: 300,
        distanceKm: 290,
        pricePrivate: 260,
      },
      {
        slug: 'tamarindo-nosara',
        origin: 'Tamarindo',
        destination: 'Nosara',
        durationMin: 120,
        distanceKm: 95,
        pricePrivate: 140,
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

/**
 * Resumen de los horarios de una ruta para quien la consuma.
 *
 * priceShared es el mas barato de las salidas: es el "desde" que la web
 * muestra en la tarjeta de la ruta. Va null cuando no hay compartido, para que
 * el llamador no confunda "gratis" con "no se vende por asiento".
 */
function summarizeSchedules(
  schedules: { departureTime: string; priceShared: unknown }[],
) {
  const prices = schedules.map((s) => Number(s.priceShared));

  return {
    sharedEnabled: schedules.length > 0,
    departureTimes: schedules.map((s) => s.departureTime),
    priceShared: prices.length > 0 ? Math.min(...prices) : null,
  };
}
