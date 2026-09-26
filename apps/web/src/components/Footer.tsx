import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { getActiveRoutes } from "@/lib/api";
import { pairRoutes } from "@/lib/route-pairs";
import { BRAND_LOGO, BRAND_FOUNDED, BRAND_WHATSAPP } from "@/lib/brand";

const COMPANY = [
  { label: 'About Us',     href: '/about' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Blog',         href: '/blog' },
  { label: 'Contact',      href: '/contact' },
];

const SUPPORT = [
  // Apunta a /find-booking y no a /account: reservar no exige cuenta, asi que
  // para la mayoria /account es un muro de login. Esa pagina sirve a los dos,
  // porque tambien ofrece entrar. Quien tiene sesion llega desde su menu.
  { label: 'Manage my booking', href: '/find-booking' },
  { label: 'Cancellation Policy', href: '/cancellation' },
  { label: 'FAQ',              href: '/faq' },
  { label: 'WhatsApp Support', href: `https://wa.me/${BRAND_WHATSAPP}` },
];

export default async function Footer() {
  // Las rutas del pie salen de la base: un link a una ruta dada de baja es un
  // 404 servido desde todas las paginas del sitio.
  const ROUTES = pairRoutes(await getActiveRoutes()).slice(0, 6).map(({ route }) => ({
    label: `${route.origin} -> ${route.destination}`,
    href: `/routes/${route.slug}`,
  }));

  return (
    <footer style={{
      position: 'relative',
      background: 'var(--brand-dark)',
      color: 'rgba(255,255,255,0.6)',
      padding: '4rem 2rem 2rem',
    }}>
      {/* Filo dorado apenas visible: cierra la pagina con la misma firma de
          color del Hero en vez de un corte plano */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(to right, transparent, rgba(201,151,58,0.5) 50%, transparent)',
      }} />

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              {/* Disco crema: el logo es artwork oscuro y necesita fondo claro */}
              <span style={{
                width: '52px', height: '52px', flexShrink: 0,
                borderRadius: '50%', background: 'var(--brand-cream)',
                display: 'block', position: 'relative', overflow: 'hidden',
              }}>
                <Image
                  src={BRAND_LOGO}
                  alt=""
                  fill
                  sizes="52px"
                  style={{ objectFit: 'contain' }}
                />
              </span>
              <span style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.05rem', fontWeight: 700, color: '#fff',
                lineHeight: 1.2,
              }}>
                Retana Services
                <span style={{
                  display: 'block', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: 'var(--brand-gold)',
                }}>
                  Tamarindo · since {BRAND_FOUNDED}
                </span>
              </span>
            </div>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem',
              lineHeight: 1.7, marginBottom: '1.5rem',
              color: 'rgba(255,255,255,0.7)',
            }}>
              The most reliable shuttle service in Guanacaste.
              Shared seats from $30, private transfers any time.
            </p>
            <a
              href={`https://wa.me/${BRAND_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-whatsapp"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                // Texto oscuro sobre el verde de WhatsApp: en blanco no llega
                // al contraste minimo y el verde es el que lo hace reconocible
                background: '#25D366', color: 'var(--brand-dark)',
                padding: '9px 16px', borderRadius: '8px',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem',
                fontWeight: 500, textDecoration: 'none',
              }}
            >
              <MessageCircle size={16} strokeWidth={2} />
              WhatsApp Us
            </a>
          </div>

          {/* Routes */}
          <div>
            <h2 style={{
              color: '#fff', fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500, fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '1.25rem',
            }}>
              Popular Routes
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {ROUTES.map(r => (
                <li key={r.href}>
                  <Link href={r.href} className="footer-link" style={{
                    color: 'rgba(255,255,255,0.72)',
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
            <h2 style={{
              color: '#fff', fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500, fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '1.25rem',
            }}>
              Company
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {COMPANY.map(r => (
                <li key={r.href}>
                  <Link href={r.href} className="footer-link" style={{
                    color: 'rgba(255,255,255,0.72)',
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
            <h2 style={{
              color: '#fff', fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500, fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '1.25rem',
            }}>
              Support
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {SUPPORT.map(r => (
                <li key={r.href}>
                  <Link href={r.href} className="footer-link" style={{
                    color: 'rgba(255,255,255,0.72)',
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
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.62)' }}>
            © {new Date().getFullYear()} Retana Services Tamarindo. All rights reserved.
            {' '}Site by{' '}
            <a
              href="https://321solutions.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              // Subrayado a proposito: dentro de un parrafo, el color solo no
              // alcanza para que se vea que es un enlace
              style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}
            >
              321 Solutions
            </a>
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ].map(r => (
              <Link key={r.href} href={r.href} className="footer-link" style={{
                color: 'rgba(255,255,255,0.62)',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
                textDecoration: 'none',
              }}>
                {r.label}
              </Link>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .footer-link { transition: color 0.2s; }
        .footer-link:hover { color: var(--brand-gold) !important; }
        .footer-whatsapp { transition: transform 0.15s, box-shadow 0.15s; }
        .footer-whatsapp:hover { transform: translateY(-1px); box-shadow: 0 6px 16px -4px rgba(37,211,102,0.5); }
      `}</style>
    </footer>
  );
}

