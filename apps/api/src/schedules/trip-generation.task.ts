import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SchedulesService } from './schedules.service';

/**
 * Mantiene la ventana rodante de salidas.
 *
 * Es la pieza que evita que el catalogo se venza solo: cada noche agrega el dia
 * nuevo que entro al horizonte. Antes esto era un seed manual de 30 dias que,
 * pasados 30 dias, dejaba el sitio sin nada que vender y sin avisar.
 */
@Injectable()
export class TripGenerationTask {
  private readonly logger = new Logger(TripGenerationTask.name);

  constructor(private readonly schedulesService: SchedulesService) {}

  // 03:00 en hora de Costa Rica (09:00 UTC): fuera del horario de reservas
  @Cron('0 9 * * *', { name: 'generate-trips' })
  async handleCron() {
    try {
      const result = await this.schedulesService.generateTrips();
      this.logger.log(
        `Ventana rodante al dia: ${result.created} salidas nuevas hasta ${result.until}`,
      );
    } catch (error) {
      // Un fallo no debe tumbar el proceso: manana vuelve a intentar, y la
      // ventana de 60 dias da margen de sobra para notarlo y arreglarlo.
      this.logger.error(
        `Fallo la generacion de viajes: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
