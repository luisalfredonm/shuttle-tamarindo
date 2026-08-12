'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, outboundTrip } from '@/lib/api';
import BookingLegs from './BookingLegs';

export default function BookingSuccess() {
  const params    = useSearchParams();
  const bookingId = params.get('bookingId') || '';

  const [booking, setBooking] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    Promise.all([
      authFetch(`/bookings/${bookingId}`),
      authFetch(`/payments/booking/${bookingId}`).catch(() => null),
    ]).then(([b, p]) => {
      setBooking(b);
      setPayment(p);
    }).catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) return (
    <div style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif', color: 'var(--brand-gray)' }}>
      Loading your confirmation...
    </div>
  );

  if (!booking) return (
    <div style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      Booking not found.
    </div>
  );

  const dep = new Date(outboundTrip(booking).departureAt);
  const isRoundTrip = booking.tripType === 'ROUND_TRIP';

  return (
    <div style={{ maxWidth: '540px', width: '100%' }}>

      {/* Success header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'var(--brand-green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '2.2rem', color: '#fff',
        }}>
          ✓
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--brand-dark)' }}>
          You're all set!
        </h1>
        <p style={{ color: 'var(--brand-gray)', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem' }}>
          Payment confirmed. Your transfer is booked.
        </p>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fff', borderRadius: '20px',
        border: '1px solid #e8e4dc', overflow: 'hidden',
        marginBottom: '1.5rem',
      }}>
        {/* Route header */}
        <div style={{
          background: 'var(--brand-dark)',
          padding: '1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              {isRoundTrip ? 'Your Round Trip' : 'Your Transfer'}
            </div>
            <div style={{ color: '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '1rem' }}>
              {outboundTrip(booking).route.origin}
            </div>
            {/* La doble flecha avisa que hay regreso; el detalle va abajo */}
            <div style={{ color: 'var(--brand-gold)', fontSize: '1.1rem', margin: '2px 0' }}>
              {isRoundTrip ? '⇅' : '↓'}
            </div>
            <div style={{ color: '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '1rem' }}>
              {outboundTrip(booking).route.destination}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Departure
            </div>
            <div style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>
              {dep.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', marginTop: '4px' }}>
              {dep.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Cada salida por separado: el cliente tiene que ver las dos fechas */}
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <BookingLegs legs={booking.legs} showAmount={false} />
        </div>

        {/* Details grid */}
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {[
            { label: 'Booking ID',    value: booking.id.slice(0, 8).toUpperCase() },
            { label: 'Status',        value: '✓ Confirmed', green: true },
            { label: 'Type',          value: booking.type === 'SHARED' ? 'Shared Shuttle' : 'Private Transfer' },
            { label: 'Passengers',    value: `${booking.passengers}` },
            { label: 'Amount Paid',   value: `$${booking.totalAmount} USD`, green: true },
            { label: 'Transaction',   value: payment?.externalId?.slice(0, 16) || '—' },
          ].map(item => (
            <div key={item.label}>
              <div style={{
                fontSize: '0.7rem', color: 'var(--brand-gray)',
                fontFamily: 'DM Sans, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px',
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '0.95rem',
                color: (item as any).green ? 'var(--brand-green)' : 'var(--brand-dark)',
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Important info */}
        <div style={{
          margin: '0 1.5rem 1.5rem',
          background: '#f0faf5',
          border: '1px solid #c3e8d5',
          borderRadius: '10px',
          padding: '1rem',
        }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--brand-green)', fontWeight: 500, marginBottom: '6px' }}>
            What happens next?
          </p>
          <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
            {[
              'Your driver will meet you at the pickup address.',
              'Be ready 10 minutes before departure.',
              'Contact us on WhatsApp if you need help.',
            ].map(item => (
              <li key={item} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'var(--brand-gray)', marginBottom: '4px', lineHeight: 1.5 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <a
          href={'https://wa.me/50688888888?text=Hi! My booking ID is ' + booking.id.slice(0,8).toUpperCase()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#25D366', color: '#fff',
            borderRadius: '12px', padding: '14px',
            textAlign: 'center', textDecoration: 'none',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '0.95rem',
          }}
        >
          Contact Driver on WhatsApp
        </a>
        <Link href="/" style={{
          textAlign: 'center', color: 'var(--brand-gray)',
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', textDecoration: 'none',
          padding: '10px',
        }}>
          Book another transfer
        </Link>
      </div>

    </div>
  );
}
