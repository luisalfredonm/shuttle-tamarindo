"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTrips, createBooking, Trip } from "@/lib/api";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

const ROUTE_LABELS: Record<string, string> = {
  "tamarindo-liberia-airport": "Tamarindo → Liberia Airport (LIR)",
  "liberia-airport-tamarindo": "Liberia Airport (LIR) → Tamarindo",
  "tamarindo-arenal": "Tamarindo → Arenal",
  "tamarindo-monteverde": "Tamarindo → Monteverde",
  "tamarindo-san-jose": "Tamarindo → San José",
  "tamarindo-nosara": "Tamarindo → Nosara",
};

export default function BookResults() {
  const { user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const routeSlug = params.get("route") || "";
  const date = params.get("date") || "";
  const passengers = parseInt(params.get("passengers") || "1");
  const type = (params.get("type") || "SHARED") as "SHARED" | "PRIVATE";

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (!routeSlug || !date) return;
    setLoading(true);
    getTrips({ routeSlug, date })
      .then(setTrips)
      .catch(() => setError("Could not load trips. Please try again."))
      .finally(() => setLoading(false));
  }, [routeSlug, date]);

  async function handleBook(tripId: string) {
    // Reservar exige sesión: el backend saca el userId del JWT.
    // Volvemos a esta misma búsqueda después del login.
    if (!user) {
      const returnTo = `/book?${params.toString()}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    setBooking(true);
    setSelected(tripId);
    setError("");
    try {
      const b = await createBooking({
        tripId,
        type,
        passengers,
      });
      router.push(`/confirmation?bookingId=${b.id}`);
    } catch (e: any) {
      setError(e.message || "Booking failed. Please try again.");
      setBooking(false);
      setSelected("");
    }
  }

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/"
          style={{
            color: "var(--brand-green)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.9rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "1.5rem",
          }}
        >
          ← Back to home
        </Link>

        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>
          {ROUTE_LABELS[routeSlug] || routeSlug}
        </h1>
        <p
          style={{
            color: "var(--brand-gray)",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {formattedDate} ·{" "}
          {type === "SHARED"
            ? `${passengers} passenger${passengers > 1 ? "s" : ""} · Shared shuttle`
            : "Private transfer"}
        </p>
      </div>

      {/* Summary card */}
      <div
        style={{
          background: "var(--brand-dark)",
          borderRadius: "16px",
          padding: "1.25rem 1.5rem",
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            label: "Type",
            value: type === "SHARED" ? "Shared Shuttle" : "Private Transfer",
          },
          {
            label: "Passengers",
            value: type === "SHARED" ? `${passengers}` : "Full van",
          },
          { label: "Departure", value: formattedDate },
        ].map((item) => (
          <div key={item.label}>
            <div
              style={{
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.4)",
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
                color: "#fff",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
                fontSize: "0.95rem",
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid #ffc5c5",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            color: "#c0392b",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--brand-gray)",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Loading available trips...
        </div>
      )}

      {/* No trips */}
      {!loading && trips.length === 0 && !error && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e8e4dc",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🗓</div>
          <h3
            style={{
              fontFamily: "DM Sans, sans-serif",
              marginBottom: "0.5rem",
            }}
          >
            No trips available
          </h3>
          <p
            style={{
              color: "var(--brand-gray)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.9rem",
            }}
          >
            Try a different date or contact us directly.
          </p>
        </div>
      )}

      {/* Trip cards */}
      {!loading && trips.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.85rem",
              color: "var(--brand-gray)",
            }}
          >
            {trips.length} departure{trips.length > 1 ? "s" : ""} available
          </p>
          {trips.map((trip) => {
            const depTime = new Date(trip.departureAt).toLocaleTimeString(
              "en-US",
              {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              },
            );
            const price =
              type === "SHARED"
                ? Number(trip.priceShared) * passengers
                : Number(trip.pricePrivate);
            const isSelected = selected === trip.id;
            const isFull = trip.isFull && type === "SHARED";

            return (
              <div
                key={trip.id}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  border: isSelected
                    ? "2px solid var(--brand-green)"
                    : "1px solid #e8e4dc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                  opacity: isFull ? 0.5 : 1,
                }}
              >
                <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                  {/* Time */}
                  <div>
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
                      Departure
                    </div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontFamily: "Playfair Display, serif",
                        fontWeight: 700,
                        color: "var(--brand-dark)",
                      }}
                    >
                      {depTime}
                    </div>
                  </div>

                  {/* Seats */}
                  {type === "SHARED" && (
                    <div>
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
                        Seats left
                      </div>
                      <div
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontWeight: 500,
                          fontSize: "1rem",
                        }}
                      >
                        <span
                          style={{
                            color:
                              trip.availableSeats <= 3
                                ? "#e67e22"
                                : "var(--brand-green)",
                          }}
                        >
                          {trip.availableSeats}
                        </span>
                        <span
                          style={{
                            color: "var(--brand-gray)",
                            fontSize: "0.85rem",
                          }}
                        >
                          {" "}
                          / {trip.capacity}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div>
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
                      Duration
                    </div>
                    <div
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontWeight: 500,
                        fontSize: "1rem",
                      }}
                    >
                      {Math.floor(trip.route.durationMin / 60)}h{" "}
                      {trip.route.durationMin % 60 > 0
                        ? `${trip.route.durationMin % 60}m`
                        : ""}
                    </div>
                  </div>
                </div>

                {/* Price + CTA */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                  }}
                >
                  <div style={{ textAlign: "right" }}>
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
                      Total
                    </div>
                    <div
                      style={{
                        fontSize: "1.8rem",
                        fontFamily: "Playfair Display, serif",
                        fontWeight: 700,
                        color: "var(--brand-green)",
                      }}
                    >
                      ${price}
                    </div>
                    {type === "SHARED" && passengers > 1 && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--brand-gray)",
                          fontFamily: "DM Sans, sans-serif",
                        }}
                      >
                        ${Number(trip.priceShared)}/person
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => !isFull && handleBook(trip.id)}
                    disabled={isFull || booking}
                    style={{
                      background: isFull ? "#ccc" : "var(--brand-green)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "12px 24px",
                      cursor: isFull ? "not-allowed" : "pointer",
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 500,
                      fontSize: "0.95rem",
                      minWidth: "120px",
                      opacity: booking && !isSelected ? 0.6 : 1,
                    }}
                  >
                    {isFull
                      ? "Full"
                      : isSelected && booking
                        ? "Booking..."
                        : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
