import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Pagar y consultar pagos exige sesión; el servicio valida además que la
// reserva sea del solicitante
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  process(@Request() req: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.processPayment(dto, req.user);
  }

  @Get('booking/:bookingId')
  getByBooking(@Request() req: any, @Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentByBooking(bookingId, req.user);
  }
}
