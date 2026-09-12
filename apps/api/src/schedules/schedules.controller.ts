import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { GenerateTripsDto } from './dto/generate-trips.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Horarios de salida por ruta: la plantilla de la que salen los viajes.
 *
 * Todo es solo para ADMIN. La web nunca lee horarios: lee los Trips ya
 * generados, que es lo que se puede reservar.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  /** Carga los horarios reales del compartido y genera la primera ventana */
  @Post('schedules/seed')
  seed() {
    return this.schedulesService.seed();
  }

  /** Cobertura de todas las rutas: horarios y hasta cuando hay salidas generadas */
  @Get('schedules/coverage')
  coverage() {
    return this.schedulesService.coverage();
  }

  @Get('routes/:routeId/schedules')
  findByRoute(@Param('routeId', ParseUUIDPipe) routeId: string) {
    return this.schedulesService.findByRoute(routeId);
  }

  @Post('routes/:routeId/schedules')
  create(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulesService.create(routeId, dto);
  }

  @Patch('schedules/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(id, dto);
  }

  @Delete('schedules/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schedulesService.remove(id);
  }

  /**
   * Genera las salidas faltantes a mano, sin esperar al cron de la noche.
   * Es lo que usa el boton "Regenerar ahora" del panel.
   */
  @Post('schedules/generate')
  generate(@Body() dto: GenerateTripsDto) {
    return this.schedulesService.generateTrips(dto.daysAhead, dto.routeId);
  }
}
