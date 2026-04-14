import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  findAll(@Query() query: QueryTripsDto) {
    return this.tripsService.findAll(query);
  }

  @Post('seed')
  seed() {
    return this.tripsService.seed();
  }

  @Post()
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tripsService.findById(id);
  }
}
