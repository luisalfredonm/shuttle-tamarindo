import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AdminService } from '../admin/admin.service';
import { RequestUser } from '../auth/request-user';
import {
  NO_ACCESS,
  assertCanAccessReservation,
} from '../bookings/reservation-access';
import { PayPalProvider } from './providers/paypal.provider';
import { PaymentProvider } from './providers/payment-provider.interface';

const NOT_YOURS = NO_ACCESS;

/** Margen para diferencias de redondeo al comparar importes */
const AMOUNT_TOLERANCE = 0.01;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private adminService: AdminService,
    private paypal: PayPalProvider,
  ) {}

  private providerFor(name: string): PaymentProvider {
    if (name === 'PAYPAL') return this.paypal;
    // BAC entra aca cuando se implemente; hasta entonces no se puede prender
    throw new ServiceUnavailableException(
      `El metodo de pago ${name} todavia no esta disponible`,
    );
  }

  /** Metodos que el cliente puede usar: prendidos en el panel y con credenciales */
  async availableMethods() {
    const configs = await this.prisma.paymentMethodConfig.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
    });

    return configs
      .filter((c) => {
        try {
          return this.providerFor(c.provider).isConfigured();
        } catch {
          return false;
        }
      })
      .map((c) => {
        const provider = this.providerFor(c.provider);
        return {
          provider: c.provider,
          mode: provider.mode(),
          // El clientId es publico: el SDK de PayPal lo necesita en el navegador
          publicKey: provider.publicKey(),
        };
      });
  }

  /**
   * Paso 1: reserva el cobro en la pasarela.
   *
   * El importe sale de la reserva en la base, nunca del cliente: si viniera del
   * navegador, cualquiera podria pagar $1 por un traslado de $180.
   */
  async createOrder(reservationId: string, user?: RequestUser, token?: string) {
    const reservation = await this.loadPayable(reservationId, user, token);

    const enabled = await this.availableMethods();
    const method = enabled.find((m) => m.provider === 'PAYPAL');
    if (!method) {
      throw new ServiceUnavailableException(
        'No hay ningun metodo de pago disponible en este momento',
      );
    }

    const provider = this.providerFor(method.provider);
    const amount = Number(reservation.totalAmount);
    const outbound = reservation.legs.find((l) => l.direction === 'OUTBOUND')!;
    const description = `${outbound.trip.route.origin} - ${outbound.trip.route.destination}`;

    const order = await provider.createOrder({
      amount,
      currency: 'USD',
      reservationId: reservation.id,
      description,
    });

    // El Payment nace PENDING con la orden. El unique de orderId es lo que
    // impide que dos intentos simultaneos terminen en dos cobros.
    await this.prisma.payment.upsert({
      where: { reservationId: reservation.id },
      create: {
        reservationId: reservation.id,
        provider: provider.name,
        orderId: order.orderId,
        amount: reservation.totalAmount,
        currency: 'USD',
        status: 'PENDING',
      },
      update: {
        provider: provider.name,
        orderId: order.orderId,
        status: 'PENDING',
      },
    });

    return {
      orderId: order.orderId,
      approveUrl: order.approveUrl,
      amount,
      currency: 'USD',
    };
  }

  /**
   * Paso 2: cobra la orden que el cliente aprobo.
   *
   * Lo que dice el navegador no alcanza: la reserva se confirma solo despues de
   * que la pasarela confirma el cobro contra su propia API.
   */
  async captureOrder(orderId: string, user?: RequestUser, token?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: {
        reservation: {
          select: {
            id: true,
            userId: true,
            accessToken: true,
            bookedAsGuest: true,
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Orden de pago no encontrada');
    assertCanAccessReservation(payment.reservation, user, token);

    if (payment.status === 'PAID') {
      // Doble clic o reintento: se responde el resultado que ya existe
      return this.paidResponse(payment.reservationId);
    }

    const provider = this.providerFor(payment.provider);
    const result = await provider.captureOrder(orderId);

    if (!result.success) {
      // Sin aprobar todavia no es un fallo: el cliente puede volver al widget y
      // terminar. Marcarlo FAILED ensuciaria el historial de pagos del panel.
      const pending = result.error === 'ORDER_NOT_APPROVED';
      if (!pending) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      }
      throw new BadRequestException(customerMessage(result.error));
    }

    // Se cobro algo distinto de lo que la reserva vale: no se confirma sola.
    // Puede ser manipulacion del monto o un error de moneda, y en los dos casos
    // hace falta que una persona lo mire antes de dar el viaje por pagado.
    const expected = Number(payment.amount);
    if (
      result.amount === undefined ||
      Math.abs(result.amount - expected) > AMOUNT_TOLERANCE ||
      (result.currency && result.currency !== payment.currency)
    ) {
      this.logger.error(
        `Importe capturado distinto al esperado en la reserva ${payment.reservationId}: ` +
          `esperado ${expected} ${payment.currency}, cobrado ${result.amount} ${result.currency}`,
      );
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', externalId: result.transactionId },
      });
      throw new ConflictException(
        'El importe cobrado no coincide con la reserva. Contactanos para resolverlo.',
      );
    }

    await this.confirmPaid(payment.reservationId, result.transactionId!);
    return this.paidResponse(payment.reservationId);
  }

  /**
   * Respaldo cuando el cliente cierra la ventana justo despues de aprobar.
   *
   * La firma se verifica siempre: sin eso este endpoint publico seria una via
   * para marcar cualquier reserva como pagada.
   */
  async handleWebhook(headers: Record<string, unknown>, rawBody: string) {
    const valid = await this.paypal.verifyWebhook(headers, rawBody);
    if (!valid) {
      this.logger.warn('Webhook con firma invalida: descartado');
      return { received: false };
    }

    const event = JSON.parse(rawBody) as {
      event_type?: string;
      resource?: {
        id?: string;
        supplementary_data?: { related_ids?: { order_id?: string } };
        amount?: { value?: string; currency_code?: string };
      };
    };

    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return { received: true, ignored: event.event_type };
    }

    const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
    if (!orderId) return { received: true, ignored: 'sin order_id' };

    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });
    if (!payment || payment.status === 'PAID') {
      // Ya estaba cobrado por la captura del paso 2: nada que hacer
      return { received: true };
    }

    const captured = Number(event.resource?.amount?.value);
    if (Math.abs(captured - Number(payment.amount)) > AMOUNT_TOLERANCE) {
      this.logger.error(
        `Webhook con importe distinto para la reserva ${payment.reservationId}`,
      );
      return { received: true, mismatch: true };
    }

    await this.confirmPaid(payment.reservationId, event.resource!.id!);
    return { received: true, confirmed: true };
  }

  /** Marca la reserva pagada y avisa. Idempotente: si ya estaba, no hace nada. */
  private async confirmPaid(reservationId: string, transactionId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { reservationId },
      });
      if (!current || current.status === 'PAID') return false;

      await tx.payment.update({
        where: { reservationId },
        data: {
          status: 'PAID',
          externalId: transactionId,
          paidAt: new Date(),
        },
      });
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CONFIRMED', heldUntil: null },
      });
      return true;
    });

    if (!updated) return;

    // El correo va fuera de la transaccion: que falle el envio no puede
    // deshacer un cobro que la pasarela ya acepto.
    await this.notify(reservationId, transactionId);
  }

  private async notify(reservationId: string, transactionId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        legs: { include: { trip: { include: { route: true } } } },
        user: true,
      },
    });
    if (!reservation) return;

    const outbound = reservation.legs.find((l) => l.direction === 'OUTBOUND');
    if (!outbound) return;
    const back = reservation.legs.find((l) => l.direction === 'RETURN');

    // Antes el ida y vuelta se aplanaba en un texto ("… (ida y vuelta)") y el
    // cliente nunca veia la fecha ni la hora del regreso en su comprobante.
    const legs = [outbound, ...(back ? [back] : [])].map((leg) => ({
      direction: leg.direction,
      origin: leg.trip.route.origin,
      destination: leg.trip.route.destination,
      departure: leg.trip.departureAt,
      durationMin: leg.trip.route.durationMin,
    }));

    // En una reserva de invitado el contacto es el de la compra, no el de la
    // cuenta a la que se colgo por tener el mismo correo
    const contactName = reservation.contactName ?? reservation.user.name;
    const contactPhone = reservation.contactPhone ?? reservation.user.phone;

    const common = {
      bookingId: reservation.id,
      accessToken: reservation.accessToken,
      legs,
      passengers: reservation.passengers,
      type: reservation.type,
      amount: Number(reservation.totalAmount),
      transactionId,
      pickupAddress: reservation.pickupAddress,
      flightNumber: reservation.flightNumber,
      notes: reservation.notes,
    };

    try {
      await this.email.sendBookingConfirmation(reservation.user.email, {
        ...common,
        name: contactName,
      });

      const adminProfile = this.adminService.getProfile();
      if (adminProfile.email) {
        await this.email.sendNewBookingAlert(adminProfile.email, {
          ...common,
          name: contactName,
          adminName: adminProfile.name,
          customerName: contactName,
          customerEmail: reservation.user.email,
          customerPhone: contactPhone,
        });
      }
    } catch (error) {
      this.logger.error(
        `Pago confirmado pero fallo el aviso por correo de ${reservationId}: ` +
          (error instanceof Error ? error.message : 'error desconocido'),
      );
    }
  }

  /** Reserva que se puede pagar, o el motivo por el que no */
  private async loadPayable(
    reservationId: string,
    user?: RequestUser,
    token?: string,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        legs: { include: { trip: { include: { route: true } } } },
        payment: true,
      },
    });

    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    assertCanAccessReservation(reservation, user, token);

    if (reservation.status === 'CONFIRMED') {
      throw new BadRequestException('Esta reserva ya fue pagada');
    }
    if (reservation.status === 'CANCELLED') {
      throw new BadRequestException('Esta reserva fue cancelada');
    }

    if (reservation.heldUntil && new Date() > new Date(reservation.heldUntil)) {
      await this.prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'CANCELLED' },
      });
      throw new BadRequestException(
        'El tiempo para pagar expiró. Por favor haz una nueva reserva.',
      );
    }

    return reservation;
  }

  private async paidResponse(reservationId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { reservationId },
    });

    return {
      success: true,
      bookingId: reservationId,
      transactionId: payment?.externalId,
      amount: payment?.amount,
      currency: payment?.currency,
      status: payment?.status,
    };
  }

  async getPaymentByBooking(
    reservationId: string,
    user?: RequestUser,
    token?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { reservationId },
      include: {
        reservation: {
          select: {
            userId: true,
            accessToken: true,
            bookedAsGuest: true,
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Pago no encontrado');
    assertCanAccessReservation(payment.reservation, user, token);

    // No devolvemos la reserva anidada: solo se cargó para validar el permiso
    const { reservation: _owner, ...rest } = payment;
    return rest;
  }
}

/**
 * Traduce el codigo de la pasarela a algo que el cliente pueda usar.
 *
 * Los codigos como INSTRUMENT_DECLINED son para el log, no para la pantalla de
 * pago: al cliente hay que decirle que paso y que puede hacer.
 */
function customerMessage(code?: string): string {
  switch (code) {
    case 'ORDER_NOT_APPROVED':
      return 'Your payment has not been approved yet. Please finish it in the PayPal window.';
    case 'INSTRUMENT_DECLINED':
    case 'PAYER_ACTION_REQUIRED':
      return 'Your bank or PayPal declined the payment. Please try another card or account.';
    case 'ORDER_ALREADY_CAPTURED':
      return 'This payment has already been processed.';
    default:
      // No se afirma que no hubo cobro: ante un corte de red la pasarela pudo
      // haber cobrado igual, y el webhook lo va a reconciliar.
      return 'We could not confirm your payment. If you see a charge on your account, contact us before trying again.';
  }
}
