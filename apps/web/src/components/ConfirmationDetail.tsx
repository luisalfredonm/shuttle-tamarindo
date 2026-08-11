"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch, outboundTrip } from "@/lib/api";

export default function ConfirmationDetail() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("bookingId") || "";

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    authFetch(`/bookings/${bookingId}`)
      .then((b) => {
        // Si ya está confirmado, redirigir a success
        if (b.status === "CONFIRMED") {
          router.replace(`/booking-success?bookingId=${bookingId}`);
          return;
        }
        setBooking(b);
      })
      .catch(() =>
        router.replace(
          `/login?returnTo=${encodeURIComponent(`/confirmation?bookingId=${bookingId}`)}`,
        ),
      )
      .finally(() => setLoading(false));
  }, [bookingId, router]);

  if (loading)
    return (
      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          color: "var(--brand-gray)",
        }}
      >
        Loading your booking...
      </p>
    );

  if (!booking)
    return (
      <p style={{ fontFamily: "DM Sans, sans-serif" }}>Booking not found.</p>
    );

  const dep = new Date(outboundTrip(booking).departureAt);

  return (
    <div style={{ maxWidth: "520px", width: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#f0a500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
            fontSize: "2rem",
            color: "#fff",
          }}
        >
          ⏳
        </div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
          Booking Reserved!
        </h1>
        <p
          style={{
            color: "var(--brand-gray)",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Complete your payment to confirm the transfer.
        </p>
      </div>

      {/* Booking details */}
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "2rem",
          border: "1px solid #e8e4dc",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
          }}
        >
          {[
            {
              label: "Booking ID",
              value: booking.id.slice(0, 8).toUpperCase(),
            },
            { label: "Status", value: "Pending Payment" },
            {
              label: "Route",
              value: `${outboundTrip(booking).route.origin} → ${outboundTrip(booking).route.destination}`,
            },
            {
              label: "Date",
              value: dep.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            },
            {
              label: "Time",
              value: dep.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
            { label: "Passengers", value: `${booking.passengers}` },
            { label: "Type", value: booking.type },
            { label: "Total", value: `$${booking.totalAmount}` },
          ].map((item) => (
            <div key={item.label}>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--brand-gray)",
                  fontFamily: "DM Sans, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "2px",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  color:
                    item.label === "Total"
                      ? "var(--brand-green)"
                      : "var(--brand-dark)",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <button
          onClick={() => router.push(`/payment?bookingId=${booking.id}`)}
          style={{
            width: "100%",
            background: "var(--brand-green)",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "16px",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            fontSize: "1rem",
          }}
        >
          Complete Payment → ${booking.totalAmount} USD
        </button>
        <Link
          href="/"
          style={{
            textAlign: "center",
            color: "var(--brand-gray)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.9rem",
            textDecoration: "none",
            padding: "8px",
          }}
        >
          Cancel and go home
        </Link>
      </div>
    </div>
  );
}
