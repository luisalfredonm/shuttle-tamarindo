'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpenCheck, Bus, CalendarClock, CreditCard, Route, Tag, UserRound, LogOut, ArrowUpRight, Menu, X } from 'lucide-react';

/** Lo del día a día, a un toque en la barra de abajo del teléfono. El resto va en "More". */
const TABS = ['/dashboard', '/bookings', '/trips', '/schedules'];

/** Sitio publico al que apunta "View website". En produccion hay que
 *  cargar NEXT_PUBLIC_SITE_URL: sin eso el link manda al localhost del que mira. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const NAV = [
  { label: 'Home',      href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings',  href: '/bookings',  icon: BookOpenCheck },
  { label: 'Trips',     href: '/trips',     icon: Bus },
  { label: 'Schedules', href: '/schedules', icon: CalendarClock },
  { label: 'Routes',    href: '/routes',    icon: Route },
  { label: 'Pricing',   href: '/pricing',   icon: Tag },
  { label: 'Payments',  href: '/payments',  icon: CreditCard },
  { label: 'Profile',   href: '/profile',   icon: UserRound },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cerrar el drawer al navegar: sin esto, el link te lleva a la pagina
  // nueva pero el panel se queda abierto tapando el contenido
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const navList = (
    <nav style={{ padding: '0.875rem 0.75rem', flex: 1 }}>
      {NAV.map(item => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={`nav-link${active ? ' active' : ''}`}>
            <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
            <span className="sidebar-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Solo en telefono: arriba la marca y la pagina actual, abajo las
          pestanas al alcance del pulgar. El rail lateral pasa a ser el drawer
          de "More" */}
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div className="mobile-topbar-logo">S</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Retana Services
            </div>
            <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 650, lineHeight: 1.2 }}>
              {NAV.find((n) => pathname.startsWith(n.href))?.label ?? 'Admin'}
            </div>
          </div>
        </div>
      </div>

      <nav className="tabbar" aria-label="Main">
        {NAV.filter((n) => TABS.includes(n.href)).map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`tabbar-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon size={21} strokeWidth={active ? 2.3 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`tabbar-item${NAV.some((n) => !TABS.includes(n.href) && pathname.startsWith(n.href)) ? ' active' : ''}`}
          onClick={() => setMobileOpen(true)}
          aria-label="More sections"
        >
          <Menu size={21} strokeWidth={1.8} />
          <span>More</span>
        </button>
      </nav>

      <div
        className={`sidebar-backdrop${mobileOpen ? ' mobile-open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`admin-sidebar${mobileOpen ? ' mobile-open' : ''}`}
        style={{
          width: 'var(--sidebar-w)',
          background: 'var(--sidebar-bg)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 65,
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >

        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
              background: 'var(--brand-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.95rem', fontWeight: 700, color: '#fff',
              boxShadow: '0 2px 8px rgba(26,107,74,0.4)',
            }}>S</div>
            <div className="sidebar-brand-text">
              <div style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.2 }}>Retana Services Tamarindo</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.68rem', marginTop: '2px' }}>Admin Panel</div>
            </div>
          </div>
          {/* Cerrar el drawer: solo aparece cuando el rail esta en modo mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="mobile-topbar-btn sidebar-close-btn"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {navList}

        {/* Footer */}
        <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', padding: '6px 4px', borderRadius: '6px', transition: 'color 0.15s' }}>
            <ArrowUpRight size={14} />
            <span className="sidebar-footer-text">View website</span>
          </a>
          <button onClick={handleLogout}
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', padding: '6px 4px', borderRadius: '6px', transition: 'color 0.15s' }}>
            <LogOut size={14} />
            <span className="sidebar-footer-text">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
