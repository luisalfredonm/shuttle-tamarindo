import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Ninguna reserva es pública: todo el controlador exige sesión
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateBookingDto) {
    // El dueño de la reserva sale del token, nunca del body
    return this.bookingsService.create(req.user.id, dto);
  }

  // Listado completo con datos de contacto de cada cliente: solo ADMIN
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('user/all')
  findAll() {
    return this.bookingsService.findAllBookings();
  }

  @Get('user/:userId')
  findByUser(@Request() req: any, @Param('userId') userId: string) {
    return this.bookingsService.findByUser(userId, req.user);
  }

  @Get(':id')
  findById(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.findById(id, req.user);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.cancel(id, req.user);
  }

  // Confirmar sin pagar es un override manual de staff.
  // El flujo normal lo hace PaymentsService al acreditar el pago.
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.bookingsService.confirm(id);
  }
}
