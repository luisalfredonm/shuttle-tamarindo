'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "[D]" },
  { label: "Bookings", href: "/bookings", icon: "[B]" },
  { label: "Trips", href: "/trips", icon: "[T]" },
  { label: "Routes", href: "/routes", icon: "[R]" },
  { label: "Profile", href: "/profile", icon: "[P]" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--brand-dark)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--brand-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-dark)',
          }}>S</div>
          <div>
            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>Shuttle Tamarindo</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
        {NAV.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px',
              marginBottom: '2px', textDecoration: 'none',
              background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: '0.875rem', fontWeight: active ? 500 : 400,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', textDecoration: 'none' }}>
          View website
        </a>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
