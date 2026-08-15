'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpenCheck, Bus, Route, UserRound, LogOut, ArrowUpRight, Menu, X } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings',  href: '/bookings',  icon: BookOpenCheck },
  { label: 'Trips',     href: '/trips',     icon: Bus },
  { label: 'Routes',    href: '/routes',    icon: Route },
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
      {/* Solo visible en telefono: la barra fija reemplaza al rail lateral,
          que en esa medida pasa a ser un drawer oculto por defecto */}
      <div className="mobile-topbar">
        <button
          className="mobile-topbar-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
          Retana Services Tamarindo
        </span>
        <span style={{ width: '22px' }} />
      </div>

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
          <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer"
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
