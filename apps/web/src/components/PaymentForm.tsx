"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/api";

export default function PaymentForm() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("bookingId") || "";

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  // Cargar booking
  useEffect(() => {
    if (!bookingId) return;
    authFetch(`/bookings/${bookingId}`)
      .then((b) => {
        setBooking(b);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingId]);

  // Countdown del hold
  useEffect(() => {
    if (!booking?.heldUntil) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor((new Date(booking.heldUntil).getTime() - Date.now()) / 1000),
      );
      setTimeLeft(diff);
      if (diff === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      await authFetch("/payments/process", {
        method: "POST",
        body: JSON.stringify({ bookingId }),
      });
      router.push(`/booking-success?bookingId=${bookingId}`);
    } catch (e: any) {
      setError(e.message || "Payment failed. Please try again.");
      setPaying(false);
    }
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  if (loading)
    return (
      <p style={{ fontFamily: "DM Sans, sans-serif" }}>Loading booking...</p>
    );
  if (!booking)
    return (
      <p style={{ fontFamily: "DM Sans, sans-serif" }}>Booking not found.</p>
    );

  const dep = new Date(booking.trip.departureAt);

  return (
    <div style={{ maxWidth: "480px", width: "100%" }}>
      <Link
        href="/"
        style={{
          color: "var(--brand-green)",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.9rem",
          textDecoration: "none",
          display: "inline-block",
          marginBottom: "1.5rem",
        }}
      >
        ← Back
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
        Complete Payment
      </h1>
      <p
        style={{
          color: "var(--brand-gray)",
          fontFamily: "DM Sans, sans-serif",
          marginBottom: "2rem",
        }}
      >
        Your seats are reserved. Complete payment to confirm.
      </p>

      {/* Countdown */}
      {timeLeft > 0 && (
        <div
          style={{
            background: timeLeft < 120 ? "#fff5e6" : "#f0faf5",
            border: `1px solid ${timeLeft < 120 ? "#f0a500" : "var(--brand-green)"}`,
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.9rem",
              color: "var(--brand-dark)",
            }}
          >
            Time to complete payment
          </span>
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: timeLeft < 120 ? "#f0a500" : "var(--brand-green)",
            }}
          >
            {mins}:{secs}
          </span>
        </div>
      )}

      {timeLeft === 0 && booking.status === "PENDING" && (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid #ffc5c5",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "1.5rem",
            color: "#c0392b",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.9rem",
          }}
        >
          Your reservation expired. Please start a new booking.
        </div>
      )}

      {/* Booking summary */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "1.5rem",
          border: "1px solid #e8e4dc",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            fontSize: "0.9rem",
            color: "var(--brand-gray)",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Booking Summary
        </h3>
        {[
          {
            label: "Route",
            value: `${booking.trip.route.origin} → ${booking.trip.route.destination}`,
          },
          {
            label: "Date",
            value: dep.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
          },
          {
            label: "Time",
            value: dep.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          { label: "Type", value: booking.type },
          { label: "Passengers", value: `${booking.passengers}` },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #f5f2ec",
            }}
          >
            <span
              style={{
                color: "var(--brand-gray)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.9rem",
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
                fontSize: "0.9rem",
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "1rem",
            marginTop: "0.5rem",
          }}
        >
          <span style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}>
            Total
          </span>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--brand-green)",
            }}
          >
            ${booking.totalAmount}
          </span>
        </div>
      </div>

      {/* Mock notice */}
      <div
        style={{
          background: "#fffbf0",
          border: "1px solid #f0d080",
          borderRadius: "10px",
          padding: "12px 16px",
          marginBottom: "1.5rem",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.85rem",
          color: "#856404",
        }}
      >
        Secure payment powered by BAC Credomatic. Test mode active.
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid #ffc5c5",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "1.5rem",
            color: "#c0392b",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={paying || timeLeft === 0}
        style={{
          width: "100%",
          background: "var(--brand-green)",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          padding: "16px",
          cursor: paying || timeLeft === 0 ? "not-allowed" : "pointer",
          fontFamily: "DM Sans, sans-serif",
          fontWeight: 500,
          fontSize: "1rem",
          opacity: paying || timeLeft === 0 ? 0.6 : 1,
        }}
      >
        {paying ? "Processing payment..." : `Pay $${booking.totalAmount} USD`}
      </button>

      <p
        style={{
          textAlign: "center",
          marginTop: "1rem",
          color: "var(--brand-gray)",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.8rem",
        }}
      >
        256-bit SSL encryption · Secure payment
      </p>
    </div>
  );
}
