import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private get isMock(): boolean {
    return process.env.PAYMENT_MODE !== 'live';
  }

  async processPayment(dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { trip: { include: { route: true } }, payment: true },
    });

    if (!booking) throw new NotFoundException('Booking no encontrado');
    if (booking.status === 'CONFIRMED') {
      throw new BadRequestException('Este booking ya fue pagado');
    }
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Este booking fue cancelado');
    }

    if (booking.heldUntil && new Date() > new Date(booking.heldUntil)) {
      await this.prisma.booking.update({
        where: { id: dto.bookingId },
        data: { status: 'CANCELLED' },
      });
      throw new BadRequestException(
        'El tiempo para pagar expiró. Por favor haz una nueva reserva.',
      );
    }

    const paymentResult: PaymentResult = this.isMock
      ? await this.mockPayment()
      : await this.bacPayment(dto.cardToken);

    if (!paymentResult.success) {
      throw new BadRequestException(
        paymentResult.error || 'El pago fue rechazado',
      );
    }

    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: dto.bookingId },
        data: { status: 'CONFIRMED', heldUntil: null },
      }),
      this.prisma.payment.create({
        data: {
          bookingId: dto.bookingId,
          provider: this.isMock ? 'MOCK' : 'BAC_CREDOMATIC',
          externalId: paymentResult.transactionId,
          amount: booking.totalAmount,
          currency: 'USD',
          status: 'PAID',
          paidAt: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      bookingId: booking.id,
      transactionId: paymentResult.transactionId,
      amount: booking.totalAmount,
      currency: 'USD',
      status: 'PAID',
      mode: this.isMock ? 'SIMULATED' : 'LIVE',
      booking: {
        id: booking.id,
        route: `${booking.trip.route.origin} → ${booking.trip.route.destination}`,
        departure: booking.trip.departureAt,
        passengers: booking.passengers,
        type: booking.type,
      },
    };
  }

  private async mockPayment(): Promise<PaymentResult> {
    await new Promise((r) => setTimeout(r, 800));
    return {
      success: true,
      transactionId: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    };
  }

  private async bacPayment(cardToken?: string): Promise<PaymentResult> {
    const apiKey = process.env.BAC_API_KEY;
    const merchantId = process.env.BAC_MERCHANT_ID;
    const apiUrl = process.env.BAC_API_URL;

    if (!apiKey || !merchantId || !apiUrl) {
      return {
        success: false,
        error: 'BAC Credomatic no está configurado',
      };
    }

    // TODO: implementar integración real con BAC
    return {
      success: false,
      error: 'Integración BAC pendiente de configuración',
    };
  }

  async getPaymentByBooking(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }
}
