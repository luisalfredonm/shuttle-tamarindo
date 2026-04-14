"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 2rem",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "rgba(13,31,23,0.97)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          transition: "background 0.3s, border 0.3s",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "var(--brand-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              color: "var(--brand-dark)",
              fontWeight: 700,
              fontFamily: "Playfair Display, serif",
            }}
          >
            S
          </div>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Shuttle Tamarindo
          </span>
        </Link>

        {/* Desktop links */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "2rem" }}
          className="desktop-nav"
        >
          {[
            { label: "Routes", href: "/routes" },
            { label: "Why Us", href: "/#why-us" },
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Blog", href: "/blog" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              style={{
                color: "rgba(255,255,255,0.75)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDropOpen(!dropOpen)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  padding: "7px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#fff",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.875rem",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "var(--brand-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--brand-dark)",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.name.split(" ")[0]}
              </button>

              {dropOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "44px",
                    right: 0,
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e8e4dc",
                    minWidth: "180px",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  }}
                >
                  <Link
                    href="/account"
                    onClick={() => setDropOpen(false)}
                    style={{
                      display: "block",
                      padding: "11px 16px",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--brand-dark)",
                      textDecoration: "none",
                      borderBottom: "1px solid #f0ece4",
                    }}
                  >
                    My Bookings
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "11px 16px",
                      background: "none",
                      border: "none",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "0.875rem",
                      color: "#c0392b",
                      cursor: "pointer",
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                color: "rgba(255,255,255,0.7)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          )}

          <Link
            href="/#book"
            style={{
              background: "var(--brand-gold)",
              color: "var(--brand-dark)",
              padding: "9px 20px",
              borderRadius: "8px",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Book Now
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "none",
              flexDirection: "column",
              gap: "5px",
              padding: "4px",
            }}
            className="hamburger"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  width: "22px",
                  height: "2px",
                  background: "#fff",
                  borderRadius: "2px",
                }}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: "68px",
            left: 0,
            right: 0,
            zIndex: 99,
            background: "rgba(13,31,23,0.98)",
            backdropFilter: "blur(12px)",
            padding: "1.5rem 2rem 2rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {[
            { label: "Routes", href: "/routes" },
            { label: "Why Us", href: "/#why-us" },
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Blog", href: "/blog" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: "rgba(255,255,255,0.8)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "1rem",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "1rem",
                  textDecoration: "none",
                }}
              >
                My Bookings
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#e74c3c",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "1rem",
                  textAlign: "left",
                  padding: 0,
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                color: "rgba(255,255,255,0.8)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "1rem",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          )}
          <Link
            href="/#book"
            onClick={() => setMenuOpen(false)}
            style={{
              background: "var(--brand-gold)",
              color: "var(--brand-dark)",
              padding: "12px 20px",
              borderRadius: "8px",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
              fontSize: "0.95rem",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Book Now
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
