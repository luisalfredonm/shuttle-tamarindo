import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@shuttle/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RouteImagesService } from './route-images.service';

@Injectable()
export class RoutesService {
  constructor(
    private prisma: PrismaService,
    private routeImages: RouteImagesService,
  ) {}

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
          select: { departureTime: true, priceShared: true, daysOfWeek: true },
          orderBy: { departureTime: 'asc' },
        },
      },
    });

    return routes.map(({ schedules, ...route }) => ({
      ...route,
      ...summarizeSchedules(schedules),
      reverseSlug: findReverse(routes, route)?.slug ?? null,
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
          select: { departureTime: true, priceShared: true, daysOfWeek: true },
          orderBy: { departureTime: 'asc' },
        },
      },
    });

    if (!route) throw new NotFoundException(`Ruta "${slug}" no encontrada`);

    const { schedules, ...rest } = route;
    const reverse = await this.findReverseRoute(route, true);

    return {
      ...rest,
      ...summarizeSchedules(schedules),
      reverseSlug: reverse?.slug ?? null,
    };
  }

  async create(dto: CreateRouteDto) {
    await this.assertSlugAvailable(dto.slug);

    return this.prisma.$transaction(async (tx) => {
      // Al dar de alta el regreso de una ruta que ya tiene precio round trip,
      // lo hereda si no trae uno propio. Un campo vacio no borra el de la
      // inversa: al crear, vacio significa "no lo cargue", no "sacarlo".
      const pricePrivateRoundTrip =
        dto.pricePrivateRoundTrip ??
        (await this.findReverseRoute(dto, false, tx))?.pricePrivateRoundTrip ??
        null;

      const created = await tx.route.create({
        data: { ...dto, pricePrivateRoundTrip },
      });
      await this.syncRoundTripPrice(tx, created);
      return created;
    });
  }

  async update(id: string, dto: UpdateRouteDto) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException(`Ruta no encontrada`);
    if (dto.slug && dto.slug !== route.slug) {
      await this.assertSlugAvailable(dto.slug);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.route.update({ where: { id }, data: dto });
      if (dto.pricePrivateRoundTrip !== undefined) {
        await this.syncRoundTripPrice(tx, updated);
      }
      return updated;
    });
  }

  /**
   * Ruta que deshace el camino de la dada (origen y destino invertidos).
   *
   * No hay una relacion guardada entre las dos: se reconocen por el texto,
   * igual que en el buscador y al validar el regreso de una reserva.
   */
  private findReverseRoute(
    route: { origin: string; destination: string; slug: string },
    activeOnly: boolean,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.route.findFirst({
      where: {
        origin: route.destination,
        destination: route.origin,
        slug: { not: route.slug },
        ...(activeOnly ? { isActive: true } : {}),
      },
    });
  }

  /**
   * El round trip cuesta lo mismo sin importar desde que lado sale: se copia
   * a la inversa para que el admin lo cargue una vez y no puedan quedar
   * distintos.
   */
  private async syncRoundTripPrice(
    tx: Prisma.TransactionClient,
    route: {
      origin: string;
      destination: string;
      slug: string;
      pricePrivateRoundTrip: Prisma.Decimal | null;
    },
  ) {
    await tx.route.updateMany({
      where: {
        origin: route.destination,
        destination: route.origin,
        slug: { not: route.slug },
      },
      data: { pricePrivateRoundTrip: route.pricePrivateRoundTrip },
    });
  }

  /** El slug es unico: mejor un mensaje claro que un 500 de Prisma */
  private async assertSlugAvailable(slug: string) {
    const taken = await this.prisma.route.findUnique({ where: { slug } });
    if (taken) {
      throw new ConflictException(`Ya existe una ruta con el slug "${slug}"`);
    }
  }

  async remove(id: string) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException(`Ruta no encontrada`);
    await this.prisma.route.delete({ where: { id } });
    // Despues de borrar: si la ruta no se podia eliminar, conserva su foto
    await this.routeImages.deleteBlob(route.imageUrl);
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

function findReverse<
  T extends { slug: string; origin: string; destination: string },
>(routes: T[], route: T): T | undefined {
  return routes.find(
    (r) =>
      r.slug !== route.slug &&
      r.origin === route.destination &&
      r.destination === route.origin,
  );
}

/**
 * Resumen de los horarios de una ruta para quien la consuma.
 *
 * priceShared es el mas barato de las salidas: es el "desde" que la web
 * muestra en la tarjeta de la ruta. Va null cuando no hay compartido, para que
 * el llamador no confunda "gratis" con "no se vende por asiento".
 *
 * sharedDays junta los dias de todos los horarios (0 = domingo): con eso la
 * web puede decir "sale los sabados" en vez de un "no hay salidas" a secas.
 */
function summarizeSchedules(
  schedules: {
    departureTime: string;
    priceShared: unknown;
    daysOfWeek: number[];
  }[],
) {
  const prices = schedules.map((s) => Number(s.priceShared));
  const days = new Set(schedules.flatMap((s) => s.daysOfWeek));

  return {
    sharedEnabled: schedules.length > 0,
    departureTimes: schedules.map((s) => s.departureTime),
    sharedDays: [...days].sort((a, b) => a - b),
    priceShared: prices.length > 0 ? Math.min(...prices) : null,
  };
}
