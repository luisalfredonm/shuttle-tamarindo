import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { EmailService } from '../email/email.service';
import { AdminService } from '../admin/admin.service';
import { RequestUser, assertOwnerOrAdmin } from '../auth/request-user';

const NOT_YOURS = 'No tienes acceso a esta reserva';

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private adminService: AdminService,
  ) {}

  private get isMock(): boolean {
    return process.env.PAYMENT_MODE !== 'live';
  }

  async processPayment(dto: CreatePaymentDto, user: RequestUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { trip: { include: { route: true } }, payment: true, user: true },
    });

    if (!booking) throw new NotFoundException('Booking no encontrado');

    // Solo el dueño de la reserva puede pagarla (o un ADMIN, para cobros manuales)
    assertOwnerOrAdmin(booking.userId, user, NOT_YOURS);

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

    const route = `${booking.trip.route.origin} → ${booking.trip.route.destination}`;

    await this.email.sendBookingConfirmation(booking.user.email, {
      name: booking.user.name,
      bookingId: booking.id,
      route,
      departure: booking.trip.departureAt,
      passengers: booking.passengers,
      type: booking.type,
      amount: Number(booking.totalAmount),
      transactionId: paymentResult.transactionId!,
    });

    const adminProfile = this.adminService.getProfile();
    if (adminProfile.email) {
      await this.email.sendNewBookingAlert(adminProfile.email, {
        adminName: adminProfile.name,
        bookingId: booking.id,
        customerName: booking.user.name,
        customerEmail: booking.user.email,
        route,
        departure: booking.trip.departureAt,
        passengers: booking.passengers,
        type: booking.type,
        amount: Number(booking.totalAmount),
      });
    }

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
        route,
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
      return { success: false, error: 'BAC Credomatic no está configurado' };
    }

    // TODO: implementar integración real con BAC
    return { success: false, error: 'Integración BAC pendiente de configuración' };
  }

  async getPaymentByBooking(bookingId: string, user: RequestUser) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: { select: { userId: true } } },
    });

    if (!payment) throw new NotFoundException('Pago no encontrado');
    assertOwnerOrAdmin(payment.booking.userId, user, NOT_YOURS);

    // No devolvemos la reserva anidada: solo se cargó para validar el permiso
    const { booking: _owner, ...rest } = payment;
    return rest;
  }
}
