"use client";

import { useState } from "react";
import Link from "next/link";
import { lookupBookings } from "@/lib/api";
import TurnstileWidget from "./TurnstileWidget";

/**
 * Recupera la reserva de quien compró sin cuenta.
 *
 * El enlace de cada reserva se manda al correo, nunca se muestra acá: es lo
 * único que prueba que ese buzón es de quien pregunta. Por eso la pantalla
 * responde lo mismo exista o no el correo.
 */
export default function FindBookingForm() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || sending) return;

    setSending(true);
    setError("");
    try {
      await lookupBookings(email.trim(), turnstileToken || undefined);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not send the email. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: "460px", width: "100%" }}>
      <Link href="/" style={backStyle}>
        ← Back to home
      </Link>

      <h1 style={{ fontSize: "1.9rem", margin: "0 0 0.5rem" }}>
        Find my booking
      </h1>
      <p style={introStyle}>
        Enter the email you used to book and we will send you a link to each of
        your bookings. No account needed.
      </p>

      {sent ? (
        <div style={okStyle}>
          <strong>Check your inbox.</strong> If that email has bookings, we just
          sent a link to each one. The email can take a minute, and it
          sometimes lands in spam.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={cardStyle}>
          <label style={labelStyle} htmlFor="find-email">
            Email address
          </label>
          <input
            id="find-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@email.com"
            style={inputStyle}
          />

          <TurnstileWidget onToken={setTurnstileToken} />

          {error && <p style={errorStyle}>{error}</p>}

          <button
            type="submit"
            disabled={!valid || sending}
            style={{
              ...buttonStyle,
              opacity: !valid || sending ? 0.55 : 1,
              cursor: !valid || sending ? "default" : "pointer",
            }}
          >
            {sending ? "Sending..." : "Email me my booking"}
          </button>
        </form>
      )}

      <p style={footStyle}>
        Have an account?{" "}
        <Link href="/login" style={{ color: "var(--brand-green)" }}>
          Sign in
        </Link>{" "}
        to see your bookings there.
      </p>
    </div>
  );
}

const backStyle: React.CSSProperties = {
  color: "var(--brand-green)",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.9rem",
  textDecoration: "none",
  display: "inline-block",
  marginBottom: "1.5rem",
};
const introStyle: React.CSSProperties = {
  color: "var(--brand-gray)",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.95rem",
  lineHeight: 1.6,
  marginBottom: "1.75rem",
};
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e4dc",
  borderRadius: "16px",
  padding: "1.5rem",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.8rem",
  fontWeight: 500,
  color: "var(--brand-dark)",
  marginBottom: "6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1px solid #ddd8ce",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};
const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "1.25rem",
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "var(--brand-green)",
  color: "#fff",
  fontFamily: "DM Sans, sans-serif",
  fontWeight: 500,
  fontSize: "0.95rem",
};
const okStyle: React.CSSProperties = {
  background: "#f0faf5",
  border: "1px solid var(--brand-green)",
  borderRadius: "12px",
  padding: "1.1rem 1.25rem",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.9rem",
  lineHeight: 1.65,
  color: "var(--brand-dark)",
};
const errorStyle: React.CSSProperties = {
  color: "#c0392b",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.85rem",
  marginTop: "1rem",
  marginBottom: 0,
};
const footStyle: React.CSSProperties = {
  marginTop: "1.5rem",
  textAlign: "center",
  color: "var(--brand-gray)",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.85rem",
};
