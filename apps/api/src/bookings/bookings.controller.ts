import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get('user/all')
  findAll() {
    return this.bookingsService.findAllBookings();
  }
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.bookingsService.findByUser(userId);
  }
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.bookingsService.confirm(id);
  }
}
