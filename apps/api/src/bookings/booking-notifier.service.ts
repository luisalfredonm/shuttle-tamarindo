import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService, PayOnSiteMethod } from '../email/email.service';
import { AdminService } from '../admin/admin.service';

export interface ConfirmedNotice {
  /** Id de la transaccion en la pasarela, si se cobro en linea */
  transactionId?: string;
  /** Reserva cargada por el admin que se cobra en el sitio */
  payOnSite?: PayOnSiteMethod;
}

/**
 * Correos de una reserva confirmada: el comprobante al cliente y el aviso al
 * admin. Lo usan el cobro en linea (PayPal) y la reserva manual del panel,
 * para que los dos caminos manden exactamente el mismo correo.
 */
@Injectable()
export class BookingNotifier {
  private readonly logger = new Logger(BookingNotifier.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private adminService: AdminService,
  ) {}

  async notifyConfirmed(reservationId: string, notice: ConfirmedNotice = {}) {
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
      infants: reservation.infants,
      type: reservation.type,
      amount: Number(reservation.totalAmount),
      transactionId: notice.transactionId,
      payOnSite: notice.payOnSite,
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
        `Reserva confirmada pero fallo el aviso por correo de ${reservationId}: ` +
          (error instanceof Error ? error.message : 'error desconocido'),
      );
    }
  }
}
