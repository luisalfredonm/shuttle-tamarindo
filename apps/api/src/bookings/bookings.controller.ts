import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { clientIp } from '../common/client-ip';

/**
 * Una reserva se puede ver de dos maneras: con la sesión de su dueño o con el
 * enlace secreto que se le da al cliente al reservar (cabecera
 * X-Booking-Token). Por eso cada endpoint declara qué exige, en vez de un
 * guard para todo el controlador.
 */
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Reservar no exige cuenta. El límite por IP y el captcha del servicio son
  // lo que evita que un bot llene el inventario de reservas basura.
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @Post()
  create(@Request() req: any, @Body() dto: CreateBookingDto) {
    // El dueño de la reserva sale del token, nunca del body
    return this.bookingsService.create(
      req.user ?? undefined,
      dto,
      clientIp(req),
    );
  }

  // Listado completo con datos de contacto de cada cliente: solo ADMIN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('user/all')
  findAll() {
    return this.bookingsService.findAllBookings();
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  findByUser(@Request() req: any, @Param('userId') userId: string) {
    return this.bookingsService.findByUser(userId, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findById(
    @Request() req: any,
    @Param('id') id: string,
    @Headers('x-booking-token') token?: string,
  ) {
    return this.bookingsService.findById(id, req.user ?? undefined, token);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Patch(':id/cancel')
  cancel(
    @Request() req: any,
    @Param('id') id: string,
    @Headers('x-booking-token') token?: string,
  ) {
    return this.bookingsService.cancel(id, req.user ?? undefined, token);
  }

  // Confirmar sin pagar es un override manual de staff.
  // El flujo normal lo hace PaymentsService al acreditar el pago.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.bookingsService.confirm(id);
  }
}
