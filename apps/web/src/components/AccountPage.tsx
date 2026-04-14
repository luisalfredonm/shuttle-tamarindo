'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Booking {
  id: string;
  type: 'SHARED' | 'PRIVATE';
  passengers: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  createdAt: string;
  heldUntil: string | null;
  trip: {
    departureAt: string;
    priceShared: number;
    pricePrivate: number;
    route: {
      origin: string;
      destination: string;
      durationMin: number;
    };
  };
  payment: {
    status: string;
    externalId: string;
  } | null;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  CONFIRMED: { bg: '#f0faf5', color: '#1a6b4a',  label: 'Confirmed' },
  PENDING:   { bg: '#fff8e6', color: '#b07d00',  label: 'Pending Payment' },
  CANCELLED: { bg: '#fff0f0', color: '#c0392b',  label: 'Cancelled' },
  REFUNDED:  { bg: '#f5f0ff', color: '#6b3fa0',  label: 'Refunded' },
};

export default function AccountPage() {
  const { user, logout }        = useAuth();
  const router                  = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetch(`${API_URL}/bookings/user/${user.id}`)
      .then(r => r.json())
      .then(data => {
        setBookings(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  function handleLogout() {
    logout();
    router.push('/');
  }

  const now = new Date();

  const upcoming = bookings.filter(b =>
    new Date(b.trip.departureAt) >= now &&
    b.status !== 'CANCELLED'
  );

  const past = bookings.filter(b =>
    new Date(b.trip.departureAt) < now ||
    b.status === 'CANCELLED'
  );

  const displayed = tab === 'upcoming' ? upcoming : past;

  if (!user) return null;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 2rem' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>
            Hello, {user.name.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--brand-gray)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>
            {user.email}
          </p>
        </div>
        <button onClick={handleLogout} style={{
          background: 'none', border: '1px solid #e0ddd6',
          borderRadius: '8px', padding: '8px 16px',
          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.875rem', color: 'var(--brand-gray)',
        }}>
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem', marginBottom: '2.5rem',
      }}>
        {[
          { label: 'Total bookings',  value: bookings.length },
          { label: 'Upcoming trips',  value: upcoming.length },
          { label: 'Completed trips', value: bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.trip.departureAt) < now).length },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: '14px',
            padding: '1.25rem', border: '1px solid #e8e4dc',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '2rem', fontWeight: 700,
              fontFamily: 'Playfair Display, serif',
              color: 'var(--brand-green)', lineHeight: 1,
              marginBottom: '6px',
            }}>
              {s.value}
            </div>
            <div style={{
              fontSize: '0.8rem', color: 'var(--brand-gray)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '1px solid #e8e4dc', marginBottom: '1.5rem',
      }}>
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.9rem', fontWeight: tab === t ? 500 : 400,
            color: tab === t ? 'var(--brand-green)' : 'var(--brand-gray)',
            borderBottom: tab === t ? '2px solid var(--brand-green)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          color: 'var(--brand-gray)', fontFamily: 'DM Sans, sans-serif',
        }}>
          Loading your bookings...
        </div>
      )}

      {/* Empty state */}
      {!loading && displayed.length === 0 && (
        <div style={{
          background: '#fff', borderRadius: '16px',
          padding: '3rem', textAlign: 'center',
          border: '1px solid #e8e4dc',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {tab === 'upcoming' ? '🗓' : '📋'}
          </div>
          <h3 style={{ fontFamily: 'DM Sans, sans-serif', marginBottom: '0.5rem' }}>
            {tab === 'upcoming' ? 'No upcoming trips' : 'No past trips'}
          </h3>
          <p style={{
            color: 'var(--brand-gray)', fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.9rem', marginBottom: '1.5rem',
          }}>
            {tab === 'upcoming' ? 'Book your next transfer to get started.' : 'Your completed trips will appear here.'}
          </p>
          {tab === 'upcoming' && (
            <Link href="/#book" style={{
              background: 'var(--brand-green)', color: '#fff',
              padding: '11px 24px', borderRadius: '8px',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
              fontSize: '0.9rem', textDecoration: 'none',
            }}>
              Book a Transfer
            </Link>
          )}
        </div>
      )}

      {/* Booking cards */}
      {!loading && displayed.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayed.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}

    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const router  = useRouter();
  const dep     = new Date(booking.trip.departureAt);
  const isPast  = dep < new Date();
  const status  = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;

  return (
    <div style={{
      background: '#fff', borderRadius: '16px',
      border: '1px solid #e8e4dc', overflow: 'hidden',
      opacity: isPast && booking.status === 'CANCELLED' ? 0.6 : 1,
    }}>
      {/* Top bar */}
      <div style={{
        background: isPast ? '#f5f4f0' : 'var(--brand-dark)',
        padding: '1rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
            fontSize: '0.95rem',
            color: isPast ? 'var(--brand-dark)' : '#fff',
          }}>
            {booking.trip.route.origin} → {booking.trip.route.destination}
          </span>
          <span style={{
            background: status.bg, color: status.color,
            padding: '3px 10px', borderRadius: '100px',
            fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif',
            fontWeight: 500,
          }}>
            {status.label}
          </span>
        </div>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
          color: isPast ? 'var(--brand-gray)' : 'rgba(255,255,255,0.5)',
        }}>
          ID: {booking.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Body */}
      <div style={{
        padding: '1.25rem 1.5rem',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {[
            {
              label: 'Date',
              value: dep.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            },
            {
              label: 'Time',
              value: dep.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            },
            {
              label: 'Type',
              value: booking.type === 'SHARED' ? 'Shared' : 'Private',
            },
            {
              label: 'Passengers',
              value: `${booking.passengers}`,
            },
          ].map(item => (
            <div key={item.label}>
              <div style={{
                fontSize: '0.7rem', color: 'var(--brand-gray)',
                fontFamily: 'DM Sans, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px',
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                fontSize: '0.9rem', color: 'var(--brand-dark)',
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Amount + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '0.7rem', color: 'var(--brand-gray)',
              fontFamily: 'DM Sans, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px',
            }}>
              Total
            </div>
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.4rem', fontWeight: 700,
              color: 'var(--brand-green)',
            }}>
              ${booking.totalAmount}
            </div>
          </div>

          {/* Action buttons */}
          {booking.status === 'PENDING' && (
            <button
              onClick={() => router.push('/payment?bookingId=' + booking.id)}
              style={{
                background: 'var(--brand-gold)', color: 'var(--brand-dark)',
                border: 'none', borderRadius: '8px',
                padding: '9px 18px', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              Pay Now
            </button>
          )}

          {booking.status === 'CONFIRMED' && !isPast && (
            <a
              href={'https://wa.me/50688888888?text=My booking ID is ' + booking.id.slice(0, 8).toUpperCase()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#25D366', color: '#fff',
                borderRadius: '8px', padding: '9px 18px',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                fontSize: '0.875rem', textDecoration: 'none',
              }}
            >
              WhatsApp
            </a>
          )}

          {booking.status === 'CONFIRMED' && (
            <Link
              href={'/booking-success?bookingId=' + booking.id}
              style={{
                border: '1px solid #e0ddd6',
                borderRadius: '8px', padding: '8px 16px',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
                color: 'var(--brand-gray)', textDecoration: 'none',
              }}
            >
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
