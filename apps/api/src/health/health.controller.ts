import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  /**
   * Sonda de salud para el orquestador (Render, Docker, balanceador).
   *
   * No alcanza con responder que el proceso esta vivo: si la base no contesta
   * la API no sirve para nada, asi que hace un SELECT 1 y devuelve 503 para que
   * el orquestador deje de enrutarle trafico en vez de servir errores.
   */
  @Get()
  async check() {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      // El detalle del error no se expone: este endpoint es publico
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }

    return {
      status: 'ok',
      database: 'up',
      latencyMs: Date.now() - startedAt,
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
