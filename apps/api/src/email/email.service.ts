import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
    this.from = this.config.get('EMAIL_FROM') || 'onboarding@resend.dev';
  }

  async sendWelcome(to: string, name: string) {
    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Welcome to Retana Services Tamarindo 🌴',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0d1f17;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; width: 48px; height: 48px; background: #1a6b4a; border-radius: 12px; line-height: 48px; font-size: 24px; color: #fff; font-weight: 700;">S</div>
              <h1 style="margin: 16px 0 4px; font-size: 24px;">Welcome, ${name}!</h1>
              <p style="color: #6b7b74; margin: 0;">Your Retana Services Tamarindo account is ready.</p>
            </div>
            <div style="background: #f7f3ec; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; font-size: 15px;">You can now:</p>
              <ul style="margin: 0; padding-left: 20px; color: #0d1f17; font-size: 15px; line-height: 1.8;">
                <li>Book shared or private transfers</li>
                <li>Manage your bookings</li>
                <li>View your travel history</li>
              </ul>
            </div>
            <div style="text-align: center;">
              <a href="https://shuttletamarindo.com/book" style="display: inline-block; background: #1a6b4a; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">Book your first transfer</a>
            </div>
            <p style="text-align: center; color: #6b7b74; font-size: 13px; margin-top: 32px;">Retana Services Tamarindo · Costa Rica</p>
          </div>
        `,
      });
      this.logger.log(`Welcome email sent to ${to} — id: ${result.data?.id} error: ${JSON.stringify(result.error)}`);
    } catch (err) {
      this.logger.error('Failed to send welcome email', err);
    }
  }

  async sendBookingConfirmation(to: string, data: {
    name: string;
    bookingId: string;
    route: string;
    departure: Date;
    passengers: number;
    type: string;
    amount: number;
    transactionId: string;
  }) {
    const dep = new Date(data.departure);
    const dateStr = dep.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = dep.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Booking Confirmed — ${data.route}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0d1f17;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; width: 48px; height: 48px; background: #1a6b4a; border-radius: 12px; line-height: 48px; font-size: 24px; color: #fff; font-weight: 700;">S</div>
              <h1 style="margin: 16px 0 4px; font-size: 24px;">Booking Confirmed!</h1>
              <p style="color: #6b7b74; margin: 0;">Hi ${data.name}, your transfer is booked.</p>
            </div>
            <div style="background: #f7f3ec; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr><td style="padding: 8px 0; color: #6b7b74;">Route</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.route}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Date</td><td style="padding: 8px 0; text-align: right;">${dateStr}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Time</td><td style="padding: 8px 0; text-align: right;">${timeStr}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Passengers</td><td style="padding: 8px 0; text-align: right;">${data.passengers}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Type</td><td style="padding: 8px 0; text-align: right;">${data.type}</td></tr>
                <tr style="border-top: 1px solid #e8e4dc;"><td style="padding: 12px 0 0; font-weight: 600;">Total Paid</td><td style="padding: 12px 0 0; font-weight: 700; font-size: 18px; color: #1a6b4a; text-align: right;">$${data.amount}</td></tr>
              </table>
            </div>
            <p style="font-size: 12px; color: #6b7b74; margin: 0 0 24px;">Booking ID: ${data.bookingId.slice(0, 8).toUpperCase()} · Transaction: ${data.transactionId}</p>
            <p style="text-align: center; color: #6b7b74; font-size: 13px; margin: 0;">Retana Services Tamarindo · Costa Rica</p>
          </div>
        `,
      });
      this.logger.log(`Booking confirmation sent to ${to} — id: ${result.data?.id} error: ${JSON.stringify(result.error)}`);
    } catch (err) {
      this.logger.error('Failed to send booking confirmation', err);
    }
  }

  async sendNewBookingAlert(to: string, data: {
    adminName: string;
    bookingId: string;
    customerName: string;
    customerEmail: string;
    route: string;
    departure: Date;
    passengers: number;
    type: string;
    amount: number;
  }) {
    const dep = new Date(data.departure);
    const dateStr = dep.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = dep.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject: `New Booking — ${data.route}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0d1f17;">
            <h1 style="font-size: 20px; margin: 0 0 4px;">New Booking Received</h1>
            <p style="color: #6b7b74; margin: 0 0 24px;">Hi ${data.adminName}, a new payment was confirmed.</p>
            <div style="background: #f7f3ec; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr><td style="padding: 8px 0; color: #6b7b74;">Customer</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.customerName}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Email</td><td style="padding: 8px 0; text-align: right;">${data.customerEmail}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Route</td><td style="padding: 8px 0; text-align: right;">${data.route}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Date</td><td style="padding: 8px 0; text-align: right;">${dateStr}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Time</td><td style="padding: 8px 0; text-align: right;">${timeStr}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Passengers</td><td style="padding: 8px 0; text-align: right;">${data.passengers}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7b74;">Type</td><td style="padding: 8px 0; text-align: right;">${data.type}</td></tr>
                <tr style="border-top: 1px solid #e8e4dc;"><td style="padding: 12px 0 0; font-weight: 600;">Amount</td><td style="padding: 12px 0 0; font-weight: 700; font-size: 18px; color: #1a6b4a; text-align: right;">$${data.amount}</td></tr>
              </table>
            </div>
            <p style="font-size: 12px; color: #6b7b74;">Booking ID: ${data.bookingId.slice(0, 8).toUpperCase()}</p>
          </div>
        `,
      });
      this.logger.log(`Booking alert sent to admin ${to} — id: ${result.data?.id}`);
    } catch (err) {
      this.logger.error('Failed to send booking alert to admin', err);
    }
  }
}
