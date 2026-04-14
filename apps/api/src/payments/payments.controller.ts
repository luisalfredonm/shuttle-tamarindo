import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  process(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.processPayment(dto);
  }

  @Get('booking/:bookingId')
  getByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentByBooking(bookingId);
  }
}
