/**
 * Renderiza los correos a archivos HTML sin enviarlos.
 *
 *   npm run preview:emails            -> apps/api/.email-preview/*.html
 *
 * Sirve para revisar el diseno en el navegador antes de tocar produccion, que
 * es la unica forma de verlos sin quemar envios reales de Resend.
 */
import * as fs from 'fs';
import * as path from 'path';
import { EmailService } from '../src/email/email.service';

const OUT = path.resolve(__dirname, '..', '.email-preview');

// ConfigService de mentira: solo necesita responder get()
const config = {
  get: (key: string) =>
    ({
      SITE_URL: process.env.SITE_URL || 'https://retanaservices.com',
      RESEND_API_KEY: 're_preview_key',
      EMAIL_FROM: 'preview@example.com',
    })[key],
} as never;

const service = new EmailService(config);
const captured: { subject: string; html: string }[] = [];

// Se intercepta el envio: el script nunca debe mandar un correo de verdad
(service as unknown as { resend: unknown }).resend = {
  emails: {
    send: (msg: { subject: string; html: string }) => {
      captured.push(msg);
      return Promise.resolve({ data: { id: 'preview' }, error: null });
    },
  },
};

// Instantes UTC, como los guarda la base: 20:00Z son las 2:00 PM en CR
const at = (iso: string) => new Date(iso);

async function main() {
  await service.sendWelcome('traveler@example.com', 'Luis Alfredo Nunez Mora');

  await service.sendBookingConfirmation('traveler@example.com', {
    name: 'Luis Alfredo Nunez Mora',
    bookingId: 'a9349753-0000-0000-0000-000000000000',
    legs: [
      {
        direction: 'OUTBOUND',
        origin: 'Tamarindo',
        destination: 'Liberia Airport',
        departure: at('2026-09-23T20:00:00Z'),
        durationMin: 95,
      },
    ],
    passengers: 3,
    type: 'SHARED',
    amount: 90,
    transactionId: '8XY12345AB678901C',
    pickupAddress: 'Hotel Capitan Suizo, Playa Tamarindo',
    flightNumber: 'AA 1423',
  });

  await service.sendBookingConfirmation('traveler@example.com', {
    name: 'Ana',
    bookingId: 'b1234567-0000-0000-0000-000000000000',
    legs: [
      {
        direction: 'OUTBOUND',
        origin: 'Liberia Airport',
        destination: 'Tamarindo',
        departure: at('2026-10-02T15:30:00Z'),
        durationMin: 75,
      },
      {
        direction: 'RETURN',
        origin: 'Tamarindo',
        destination: 'Liberia Airport',
        departure: at('2026-10-09T17:15:00Z'),
        durationMin: 75,
      },
    ],
    passengers: 1,
    type: 'PRIVATE',
    amount: 1250.5,
    transactionId: '9ZZ99999ZZ999999Z',
    pickupAddress: 'Hotel & Spa "Los Suenos"',
    notes: 'Traveling with a surfboard bag & a baby seat',
  });

  await service.sendNewBookingAlert('admin@example.com', {
    adminName: 'Christian',
    name: 'Luis Alfredo Nunez Mora',
    customerName: 'Luis Alfredo Nunez Mora',
    customerEmail: 'traveler@example.com',
    customerPhone: '+506 8318 3226',
    bookingId: 'a9349753-0000-0000-0000-000000000000',
    legs: [
      {
        direction: 'OUTBOUND',
        origin: 'Tamarindo',
        destination: 'Liberia Airport',
        departure: at('2026-09-23T20:00:00Z'),
        durationMin: 95,
      },
    ],
    passengers: 3,
    type: 'SHARED',
    amount: 90,
    transactionId: '8XY12345AB678901C',
    pickupAddress: 'Hotel Capitan Suizo, Playa Tamarindo',
    flightNumber: 'AA 1423',
  });

  await service.sendBookingLinks('traveler@example.com', 'Ana Retana', [
    {
      bookingId: 'b1234567-0000-0000-0000-000000000000',
      accessToken: 'tok_de_prueba_no_real',
      status: 'CONFIRMED',
      amount: 120,
      outbound: {
        direction: 'OUTBOUND',
        origin: 'Liberia Airport',
        destination: 'Tamarindo',
        departure: at('2026-10-02T15:30:00Z'),
        durationMin: 75,
      },
    },
    {
      bookingId: 'c7654321-0000-0000-0000-000000000000',
      accessToken: 'otro_tok_de_prueba',
      status: 'PENDING',
      amount: 60,
      outbound: {
        direction: 'OUTBOUND',
        origin: 'Tamarindo',
        destination: 'Liberia Airport',
        departure: at('2026-10-09T17:15:00Z'),
        durationMin: 75,
      },
    },
  ]);

  const names = [
    'welcome',
    'booking-one-way',
    'booking-round-trip',
    'admin-alert',
    'booking-links',
  ];
  fs.mkdirSync(OUT, { recursive: true });
  captured.forEach((msg, i) => {
    const file = path.join(OUT, `${names[i]}.html`);
    fs.writeFileSync(file, msg.html, 'utf8');
    console.log(
      `${names[i].padEnd(20)} ${msg.subject}\n${' '.repeat(21)}${file}`,
    );
  });
}

void main();
