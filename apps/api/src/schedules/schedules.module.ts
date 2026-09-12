import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { TripGenerationTask } from './trip-generation.task';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, TripGenerationTask],
  exports: [SchedulesService],
})
export class SchedulesModule {}
