import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  BRAND,
  EmailLeg,
  bookingRef,
  button,
  detail,
  detailsTable,
  escapeHtml,
  formatDate,
  formatTime,
  itinerary,
  layout,
  money,
  note,
  passengerLabel,
  refBlock,
  sectionTitle,
  serviceLabel,
  spacer,
  totalPanel,
} from './email.templates';

export interface BookingEmailData {
  name: string;
  bookingId: string;
  /** Enlace secreto: deja abrir la reserva sin cuenta, desde el correo */
  accessToken?: string | null;
  /** Tramos ya ordenados: ida primero, regreso despues si lo hay */
  legs: EmailLeg[];
  passengers: number;
  type: string;
  amount: number;
  transactionId?: string;
  pickupAddress?: string | null;
  flightNumber?: string | null;
  notes?: string | null;
}

export interface AdminAlertData extends BookingEmailData {
  adminName?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}

@Injectable()
export class EmailService {
  private resend: Resend;
  private from: string;
  /** Sitio publico al que apuntan los botones y las imagenes de los correos */
  private siteUrl: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.from =
      this.config.get<string>('EMAIL_FROM') || 'onboarding@resend.dev';
    // Sin barra final: los enlaces la agregan al armar la ruta
    this.siteUrl = (
      this.config.get<string>('SITE_URL') || 'https://retanaservices.com'
    ).replace(/\/$/, '');
  }

  /**
   * A donde lleva "View my booking".
   *
   * Con el enlace secreto abre esa reserva aunque el cliente no tenga cuenta,
   * que es el caso normal desde que se puede reservar como invitado. Sin token
   * (reservas viejas) se cae a "Mi cuenta", que exige sesion.
   */
  private bookingUrl(data: BookingEmailData): string {
    if (!data.accessToken) return `${this.siteUrl}/account`;
    return (
      `${this.siteUrl}/booking-success?bookingId=${encodeURIComponent(data.bookingId)}` +
      `&t=${encodeURIComponent(data.accessToken)}`
    );
  }

  /** Solo el nombre de pila: "Hi Luis Alfredo Nunez Mora" suena a formulario. */
  private firstName(full: string): string {
    return (full || '').trim().split(/\s+/)[0] || '';
  }

  /** "Tamarindo → Liberia Airport", para asuntos y vistas previas */
  private routeLine(leg?: EmailLeg): string {
    return leg ? `${leg.origin} → ${leg.destination}` : 'your transfer';
  }

  async sendWelcome(to: string, name: string) {
    const first = this.firstName(name);
    const html = layout({
      preheader: 'Your account is ready — book your first transfer in minutes.',
      siteUrl: this.siteUrl,
      eyebrow: 'Welcome aboard',
      title: first ? `Pura vida, ${first}` : 'Pura vida',
      intro:
        'Your account is ready. Book shared or private transfers across Guanacaste in a couple of taps.',
      content: `
        ${sectionTitle('What you can do now')}
        ${detailsTable(
          detail(
            'Book in minutes',
            'Shared shuttles and private transfers on every major Guanacaste route.',
          ) +
            detail(
              'Manage your trips',
              'Check times, passengers and pick-up details from your account.',
            ) +
            detail(
              'Keep your history',
              'Every confirmed transfer stays saved for your next trip.',
            ),
        )}
        ${spacer(4)}
        ${button(`${this.siteUrl}/book`, 'Book your first transfer')}
        ${button(`${this.siteUrl}/routes`, 'See all routes', 'ghost')}
      `,
    });

    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Welcome to ${BRAND.name} 🌴`,
        html,
      });
      this.logger.log(
        `Welcome email sent to ${to} — id: ${result.data?.id} error: ${JSON.stringify(result.error)}`,
      );
    } catch (err) {
      this.logger.error('Failed to send welcome email', err);
    }
  }

  async sendBookingConfirmation(to: string, data: BookingEmailData) {
    const outbound = data.legs[0];
    const ret = data.legs.find((l) => l.direction === 'RETURN');
    const first = this.firstName(data.name);

    // Solo se muestran los datos que la reserva realmente tiene: una fila
    // "Flight number —" en un comprobante se lee como un dato perdido.
    const extras =
      (data.pickupAddress
        ? detail('Pick-up address', data.pickupAddress)
        : '') +
      (data.flightNumber ? detail('Flight number', data.flightNumber) : '') +
      (data.notes ? detail('Your notes', data.notes) : '');

    const html = layout({
      preheader: `${this.routeLine(outbound)} · ${formatDate(outbound.departure)} at ${formatTime(outbound.departure)}`,
      siteUrl: this.siteUrl,
      eyebrow: 'Payment confirmed',
      title: first ? `You're all set, ${first}` : "You're all set",
      intro: `We received your payment and your seat${data.passengers > 1 ? 's are' : ' is'} reserved. Here is everything you need for the day of your transfer.`,
      content: `
        ${sectionTitle(ret ? 'Your itinerary' : 'Your transfer')}
        ${itinerary(outbound, { badge: ret ? 'Outbound' : undefined })}
        ${ret ? spacer(14) + itinerary(ret, { badge: 'Return' }) : ''}
        ${spacer(28)}

        ${sectionTitle('Trip details')}
        ${detailsTable(
          detail('Service', serviceLabel(data.type)) +
            detail('Passengers', passengerLabel(data.passengers)) +
            extras,
        )}

        ${sectionTitle('Payment')}
        ${refBlock([
          { name: 'Booking reference', value: bookingRef(data.bookingId) },
          ...(data.transactionId
            ? [{ name: 'Transaction', value: data.transactionId }]
            : []),
        ])}
        ${spacer(12)}
        ${this.paidPanel(data.amount)}
        ${spacer(26)}

        ${button(this.bookingUrl(data), 'View my booking')}
        ${button(`https://wa.me/${BRAND.whatsapp}`, 'Message us', 'ghost')}
        ${spacer(18)}
        ${note(
          `Please be ready <strong>10 minutes before</strong> the departure time. Need to change something? Reply to this email or message us with reference <strong>${escapeHtml(
            bookingRef(data.bookingId),
          )}</strong>.`,
        )}
      `,
    });

    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Booking confirmed — ${this.routeLine(outbound)}`,
        html,
      });
      this.logger.log(
        `Booking confirmation sent to ${to} — id: ${result.data?.id} error: ${JSON.stringify(result.error)}`,
      );
    } catch (err) {
      this.logger.error('Failed to send booking confirmation', err);
    }
  }

  async sendNewBookingAlert(to: string, data: AdminAlertData) {
    const outbound = data.legs[0];
    const ret = data.legs.find((l) => l.direction === 'RETURN');
    const adminFirst = this.firstName(data.adminName || '');
    const wa = (data.customerPhone || '').replace(/\D/g, '');

    const contactRows =
      detail('Name', data.customerName) +
      detail(
        'Email',
        `<a href="mailto:${escapeHtml(data.customerEmail)}" style="color:#1a6b4a;font-weight:700;text-decoration:none;">${escapeHtml(
          data.customerEmail,
        )}</a>`,
        true,
      ) +
      (data.customerPhone
        ? detail(
            'Phone',
            `<a href="tel:${escapeHtml(data.customerPhone)}" style="color:#1a6b4a;font-weight:700;text-decoration:none;">${escapeHtml(
              data.customerPhone,
            )}</a>`,
            true,
          )
        : '');

    const opsRows =
      detail('Service', serviceLabel(data.type)) +
      detail('Passengers', passengerLabel(data.passengers)) +
      (data.pickupAddress
        ? detail('Pick-up address', data.pickupAddress)
        : '') +
      (data.flightNumber ? detail('Flight number', data.flightNumber) : '') +
      (data.notes ? detail('Customer notes', data.notes) : '');

    const html = layout({
      preheader: `${data.customerName} · ${this.routeLine(outbound)} · ${money(data.amount)}`,
      siteUrl: this.siteUrl,
      audience: 'admin',
      eyebrow: 'New booking · paid',
      title: adminFirst ? `New booking, ${adminFirst}` : 'New booking received',
      intro: `${data.customerName} paid ${money(data.amount)} for ${passengerLabel(
        data.passengers,
      )} on ${this.routeLine(outbound)}.`,
      content: `
        ${sectionTitle(ret ? 'Itinerary' : 'Transfer')}
        ${itinerary(outbound, { badge: ret ? 'Outbound' : undefined })}
        ${ret ? spacer(14) + itinerary(ret, { badge: 'Return' }) : ''}
        ${spacer(28)}

        ${sectionTitle('Customer')}
        ${detailsTable(contactRows)}

        ${sectionTitle('Operations')}
        ${detailsTable(opsRows)}

        ${sectionTitle('Payment')}
        ${refBlock([
          { name: 'Booking reference', value: bookingRef(data.bookingId) },
          ...(data.transactionId
            ? [{ name: 'Transaction', value: data.transactionId }]
            : []),
        ])}
        ${spacer(12)}
        ${this.paidPanel(data.amount)}
        ${spacer(26)}

        ${button(
          // La direccion va literal: encodearla deja un mailto con %40 que
          // algunos clientes de escritorio no abren. Solo el asunto se encodea.
          `mailto:${escapeHtml(data.customerEmail)}?subject=${encodeURIComponent(
            `${BRAND.name} — booking ${bookingRef(data.bookingId)}`,
          )}`,
          'Email customer',
        )}
        ${wa ? button(`https://wa.me/${wa}`, 'WhatsApp customer', 'ghost') : ''}
      `,
    });

    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject: `New booking ${bookingRef(data.bookingId)} — ${this.routeLine(outbound)} · ${money(
          data.amount,
        )}`,
        html,
      });
      this.logger.log(
        `Booking alert sent to admin ${to} — id: ${result.data?.id}`,
      );
    } catch (err) {
      this.logger.error('Failed to send booking alert to admin', err);
    }
  }

  /** Panel del total. Lo comparten el comprobante y el aviso interno. */
  private paidPanel(amount: number): string {
    return totalPanel(amount, 'Total paid');
  }
}
