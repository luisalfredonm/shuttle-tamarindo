"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import BookingLegs from "./BookingLegs";

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

  const isRoundTrip = booking.tripType === "ROUND_TRIP";

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
        {/* Un bloque por salida: en ida y vuelta son dos vehículos */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--brand-gray)",
              fontFamily: "DM Sans, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.6rem",
            }}
          >
            {isRoundTrip ? "Your two departures" : "Your departure"}
          </div>
          <BookingLegs legs={booking.legs} />
        </div>

        {(booking.pickupAddress || booking.flightNumber || booking.notes) && (
          <div
            style={{
              marginBottom: "1.5rem",
              paddingBottom: "1.5rem",
              borderBottom: "1px solid #f5f2ec",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {booking.pickupAddress && (
              <DetailLine label="Pickup" value={booking.pickupAddress} />
            )}
            {booking.flightNumber && (
              <DetailLine label="Flight" value={booking.flightNumber} />
            )}
            {booking.notes && <DetailLine label="Notes" value={booking.notes} />}
          </div>
        )}

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
              label: "Trip type",
              value: isRoundTrip ? "Round trip" : "One way",
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

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "6px", fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem" }}>
      <span style={{ color: "var(--brand-gray)" }}>{label}:</span>
      <span style={{ color: "var(--brand-dark)" }}>{value}</span>
    </div>
  );
}
