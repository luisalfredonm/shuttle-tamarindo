import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { toCostaRicaParts, toUtcDeparture } from './schedule-time';

/** Dias hacia adelante que mantiene generados la ventana rodante */
export const GENERATION_WINDOW_DAYS = 60;

/**
 * Clave del advisory lock de Postgres que serializa la generacion.
 *
 * Sin esto, dos corridas simultaneas (el cron de la noche y un admin que
 * aprieta "Regenerar ahora") podrian crear la misma salida dos veces: ambas
 * leen que no existe y ambas la insertan. Un unique parcial sobre Trip seria
 * la otra via, pero Prisma no sabe expresar indices parciales y uno creado a
 * mano le genera drift en cada migracion siguiente.
 */
const GENERATION_LOCK_KEY = 4723901;

/**
 * Horarios reales del servicio compartido.
 *
 * Solo estas dos rutas tienen compartido: las demas se venden unicamente como
 * privado, y no tener horarios es justamente como se expresa eso. Los cuatro
 * tramos los cubre un mismo vehiculo (90 min por tramo mas colchon):
 *
 *   08:00 Tamarindo -> Liberia   llega 09:30
 *   10:00 Liberia  -> Tamarindo  llega 11:30
 *   12:00 Tamarindo -> Liberia   llega 13:30
 *   14:00 Liberia  -> Tamarindo  llega 15:30
 */
const SHARED_SCHEDULES: Record<string, string[]> = {
  'tamarindo-liberia-airport': ['08:00', '12:00'],
  'liberia-airport-tamarindo': ['10:00', '14:00'],
};

const SEED_PRICE_SHARED = 30;
const SEED_CAPACITY = 10;


export interface GenerationResult {
  created: number;
  skipped: number;
  windowDays: number;
  until: string;
  byRoute: { slug: string; created: number }[];
}

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Carga los horarios reales del servicio compartido y genera la ventana.
   *
   * Idempotente: si el horario ya existe no lo toca, asi que se puede correr en
   * cada despliegue nuevo. Reemplaza al viejo seed de viajes, que creaba 540
   * filas con las horas y los precios escritos en el codigo.
   */
  async seed() {
    const routes = await this.prisma.route.findMany({
      where: { slug: { in: Object.keys(SHARED_SCHEDULES) } },
    });

    if (routes.length === 0) {
      throw new BadRequestException('Primero ejecuta el seed de rutas');
    }

    let created = 0;
    let existing = 0;

    for (const route of routes) {
      for (const departureTime of SHARED_SCHEDULES[route.slug]) {
        const already = await this.prisma.routeSchedule.findUnique({
          where: {
            routeId_departureTime: { routeId: route.id, departureTime },
          },
        });

        if (already) {
          existing++;
          continue;
        }

        await this.prisma.routeSchedule.create({
          data: {
            routeId: route.id,
            departureTime,
            priceShared: SEED_PRICE_SHARED,
            capacity: SEED_CAPACITY,
          },
        });
        created++;
      }
    }

    const generation = await this.generateTrips();

    return {
      message: `${created} horarios creados, ${existing} ya existian`,
      schedulesCreated: created,
      generation,
    };
  }

  async findByRoute(routeId: string) {
    await this.assertRouteExists(routeId);

    return this.prisma.routeSchedule.findMany({
      where: { routeId },
      orderBy: { departureTime: 'asc' },
    });
  }

  async create(routeId: string, dto: CreateScheduleDto) {
    await this.assertRouteExists(routeId);

    const duplicate = await this.prisma.routeSchedule.findUnique({
      where: {
        routeId_departureTime: { routeId, departureTime: dto.departureTime },
      },
    });

    if (duplicate) {
      throw new ConflictException(
        `Esta ruta ya tiene un horario a las ${dto.departureTime}`,
      );
    }

    return this.prisma.routeSchedule.create({
      data: {
        routeId,
        departureTime: dto.departureTime,
        priceShared: dto.priceShared,
        capacity: dto.capacity ?? 10,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateScheduleDto) {
    const schedule = await this.prisma.routeSchedule.findUnique({
      where: { id },
    });
    if (!schedule) throw new NotFoundException('Horario no encontrado');

    if (dto.departureTime && dto.departureTime !== schedule.departureTime) {
      const duplicate = await this.prisma.routeSchedule.findUnique({
        where: {
          routeId_departureTime: {
            routeId: schedule.routeId,
            departureTime: dto.departureTime,
          },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          `Esta ruta ya tiene un horario a las ${dto.departureTime}`,
        );
      }
    }

    const updated = await this.prisma.routeSchedule.update({
      where: { id },
      data: dto,
    });

    // Si cambio la hora, las salidas viejas sin reservas dejan de corresponder
    // a ninguna plantilla: se limpian y el generador crea las de la hora nueva.
    let movedTrips = 0;
    if (dto.departureTime && dto.departureTime !== schedule.departureTime) {
      movedTrips = await this.deleteFutureEmptyTripsAt(
        schedule.routeId,
        schedule.departureTime,
      );
    }

    // El precio y la capacidad nuevos valen para las salidas que todavia no
    // vendieron nada. Las que ya tienen pasajeros quedan como estaban: su
    // importe ya esta congelado en Booking.amount, cambiarlo ahora solo
    // desalinearia el viaje con lo que el cliente pago.
    const repricedTrips = await this.applyToFutureEmptyTrips(updated);

    return { ...updated, repricedTrips, movedTrips };
  }

  async remove(id: string) {
    const schedule = await this.prisma.routeSchedule.findUnique({
      where: { id },
    });
    if (!schedule) throw new NotFoundException('Horario no encontrado');

    // Borrar la plantilla no borra las salidas ya generadas: las futuras sin
    // reservas se limpian, las que tienen pasajeros sobreviven para que el
    // viaje siga existiendo y el pasajero pueda viajar.
    const deletedTrips = await this.deleteFutureEmptyTripsAt(
      schedule.routeId,
      schedule.departureTime,
    );

    await this.prisma.routeSchedule.delete({ where: { id } });

    return { message: 'Horario eliminado', deletedTrips };
  }

  /**
   * Materializa las salidas faltantes de la ventana rodante.
   *
   * Idempotente: compara lo que deberia existir contra lo que ya existe y crea
   * solo la diferencia, asi que correrlo dos veces no duplica nada. Se lo puede
   * llamar todas las noches sin pensar.
   */
  async generateTrips(
    daysAhead = GENERATION_WINDOW_DAYS,
    routeId?: string,
  ): Promise<GenerationResult> {
    return this.prisma.$transaction(async (tx) => {
      // Serializa con el resto de las corridas; se libera al cerrar la
      // transaccion. Va con $executeRaw y no con $queryRaw porque la funcion
      // devuelve void y Prisma no sabe deserializar ese tipo.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${GENERATION_LOCK_KEY})`;

      const routes = await tx.route.findMany({
        where: {
          isActive: true,
          ...(routeId ? { id: routeId } : {}),
          schedules: { some: { isActive: true } },
        },
        include: { schedules: { where: { isActive: true } } },
      });

      const now = new Date();
      const horizon = new Date(now.getTime() + daysAhead * 86400000);
      let created = 0;
      let skipped = 0;
      const byRoute: { slug: string; created: number }[] = [];

      for (const route of routes) {
        // Todo lo que ya existe en la ventana, de una sola consulta
        const existing = await tx.trip.findMany({
          where: {
            routeId: route.id,
            source: 'SCHEDULED',
            departureAt: { gte: now, lte: horizon },
          },
          select: { departureAt: true },
        });
        const taken = new Set(existing.map((t) => t.departureAt.getTime()));

        const pending: {
          routeId: string;
          departureAt: Date;
          capacity: number;
          priceShared: number;
        }[] = [];

        // Se recorre dia por dia en hora de Costa Rica, no sumando 24h a un
        // instante: asi la salida de las 08:00 cae siempre a las 08:00 locales.
        const today = toCostaRicaParts(now);
        for (let offset = 0; offset <= daysAhead; offset++) {
          const cursor = new Date(
            Date.UTC(today.year, today.month - 1, today.day + offset),
          );
          const year = cursor.getUTCFullYear();
          const month = cursor.getUTCMonth() + 1;
          const day = cursor.getUTCDate();

          for (const schedule of route.schedules) {
            const departureAt = toUtcDeparture(
              year,
              month,
              day,
              schedule.departureTime,
            );

            // Nada en el pasado ni mas alla del horizonte
            if (departureAt <= now || departureAt > horizon) continue;

            if (taken.has(departureAt.getTime())) {
              skipped++;
              continue;
            }

            taken.add(departureAt.getTime());
            pending.push({
              routeId: route.id,
              departureAt,
              capacity: schedule.capacity,
              priceShared: Number(schedule.priceShared),
            });
          }
        }

        if (pending.length > 0) {
          await tx.trip.createMany({ data: pending });
          created += pending.length;
          byRoute.push({ slug: route.slug, created: pending.length });
        }
      }

      this.logger.log(
        `Generacion de viajes: ${created} creados, ${skipped} ya existian (ventana ${daysAhead} dias)`,
      );

      return {
        created,
        skipped,
        windowDays: daysAhead,
        until: horizon.toISOString(),
        byRoute,
      };
    });
  }

  /** Resumen por ruta para el panel: horarios y salidas generadas */
  async coverage() {
    const now = new Date();

    const routes = await this.prisma.route.findMany({
      where: { isActive: true },
      include: { schedules: { orderBy: { departureTime: 'asc' } } },
      orderBy: { slug: 'asc' },
    });

    const upcoming = await this.prisma.trip.groupBy({
      by: ['routeId'],
      where: { source: 'SCHEDULED', departureAt: { gte: now } },
      _count: { _all: true },
      _max: { departureAt: true },
    });

    const stats = new Map(
      upcoming.map((row) => [
        row.routeId,
        { count: row._count._all, last: row._max.departureAt },
      ]),
    );

    return routes.map((route) => {
      const stat = stats.get(route.id);
      return {
        routeId: route.id,
        slug: route.slug,
        origin: route.origin,
        destination: route.destination,
        schedules: route.schedules,
        upcomingTrips: stat?.count ?? 0,
        generatedUntil: stat?.last ?? null,
        // Sin horarios activos la ruta solo se vende como privado: es asi como
        // se dice "esta ruta no tiene compartido", sin un flag aparte
        sharedEnabled: route.schedules.some((s) => s.isActive),
      };
    });
  }

  private async assertRouteExists(routeId: string) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
    });
    if (!route) throw new NotFoundException('Ruta no encontrada');
    return route;
  }

  /**
   * Salidas futuras de una ruta a una hora local dada que no vendieron nada.
   *
   * departureAt se guarda en UTC, asi que la hora local no se puede filtrar
   * con un where directo: se traen las candidatas (futuras, sin reservas, de
   * esa ruta) y se compara la hora ya convertida. El conjunto es chico porque
   * la ventana es de 60 dias.
   */
  private async findFutureEmptyTripsAt(routeId: string, departureTime: string) {
    const candidates = await this.prisma.trip.findMany({
      where: {
        routeId,
        source: 'SCHEDULED',
        departureAt: { gte: new Date() },
        bookings: { none: {} },
      },
      select: { id: true, departureAt: true },
    });

    return candidates.filter(
      (trip) => toCostaRicaParts(trip.departureAt).time === departureTime,
    );
  }

  private async deleteFutureEmptyTripsAt(
    routeId: string,
    departureTime: string,
  ): Promise<number> {
    const matching = await this.findFutureEmptyTripsAt(routeId, departureTime);
    if (matching.length === 0) return 0;

    const result = await this.prisma.trip.deleteMany({
      where: { id: { in: matching.map((t) => t.id) } },
    });

    return result.count;
  }

  private async applyToFutureEmptyTrips(schedule: {
    routeId: string;
    departureTime: string;
    priceShared: unknown;
    capacity: number;
  }): Promise<number> {
    const matching = await this.findFutureEmptyTripsAt(
      schedule.routeId,
      schedule.departureTime,
    );
    if (matching.length === 0) return 0;

    const result = await this.prisma.trip.updateMany({
      where: { id: { in: matching.map((t) => t.id) } },
      data: {
        priceShared: Number(schedule.priceShared),
        capacity: schedule.capacity,
      },
    });

    return result.count;
  }
}
