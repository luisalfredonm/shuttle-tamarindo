import Link from 'next/link';
import { ROUTES_DATA } from "@/lib/routes-data";

const ROUTES = ROUTES_DATA.slice(0, 6).map((route) => ({
  label: `${route.origin} -> ${route.destination}`,
  href: `/routes/${route.slug}`,
}));
const COMPANY = [
  { label: 'About Us',     href: '/about' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Blog',         href: '/blog' },
  { label: 'Contact',      href: '/contact' },
];

const SUPPORT = [
  { label: 'My Bookings',      href: '/account' },
  { label: 'Cancellation Policy', href: '/cancellation' },
  { label: 'FAQ',              href: '/faq' },
  { label: 'WhatsApp Support', href: 'https://wa.me/50688888888' },
];

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--brand-dark)',
      color: 'rgba(255,255,255,0.6)',
      padding: '4rem 2rem 2rem',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Top grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem',
        }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'var(--brand-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', color: 'var(--brand-dark)', fontWeight: 700,
              }}>S</div>
              <span style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.05rem', fontWeight: 700, color: '#fff',
              }}>
                Shuttle Tamarindo
              </span>
            </div>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
              lineHeight: 1.7, marginBottom: '1.5rem',
              color: 'rgba(255,255,255,0.45)',
            }}>
              The most reliable shuttle service in Guanacaste.
              Guaranteed departures, no minimum passengers.
            </p>
            <a
              href="https://wa.me/50688888888"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#25D366', color: '#fff',
                padding: '9px 16px', borderRadius: '8px',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem',
                fontWeight: 500, textDecoration: 'none',
              }}
            >
              WhatsApp Us
            </a>
          </div>

          {/* Routes */}
          <div>
            <h4 style={{
              color: '#fff', fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500, fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '1.25rem',
            }}>
              Popular Routes
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {ROUTES.map(r => (
                <li key={r.href}>
                  <Link href={r.href} style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
                    textDecoration: 'none',
                  }}>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{
              color: '#fff', fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500, fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '1.25rem',
            }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {COMPANY.map(r => (
                <li key={r.href}>
                  <Link href={r.href} style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
                    textDecoration: 'none',
                  }}>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{
              color: '#fff', fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500, fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '1.25rem',
            }}>
              Support
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {SUPPORT.map(r => (
                <li key={r.href}>
                  <Link href={r.href} style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
                    textDecoration: 'none',
                  }}>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} Shuttle Tamarindo. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ].map(r => (
              <Link key={r.href} href={r.href} style={{
                color: 'rgba(255,255,255,0.3)',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
                textDecoration: 'none',
              }}>
                {r.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}

