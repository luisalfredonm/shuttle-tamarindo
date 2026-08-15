"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/** El tramo de ida representa la reserva en los listados */
const outboundLeg = (b: any) =>
  b?.legs?.find((l: any) => l.direction === "OUTBOUND") ?? b?.legs?.[0];

interface Stats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  todayBookings: number;
}

export default function DashboardContent() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/bookings/user/all").catch(() => []),
      apiFetch("/trips").catch(() => []),
    ])
      .then(([b, t]) => {
        setBookings(Array.isArray(b) ? b : []);
        setTrips(Array.isArray(t) ? t : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats: Stats = {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter((b) => b.status === "CONFIRMED").length,
    pendingBookings: bookings.filter((b) => b.status === "PENDING").length,
    cancelledBookings: bookings.filter((b) => b.status === "CANCELLED").length,
    totalRevenue: bookings
      .filter((b) => b.status === "CONFIRMED")
      .reduce((sum, b) => sum + Number(b.totalAmount), 0),
    todayBookings: bookings.filter((b) => {
      const d = new Date(b.createdAt);
      const n = new Date();
      return d.getDate() === n.getDate() && d.getMonth() === n.getMonth();
    }).length,
  };

  const upcomingTrips = trips
    .filter((t) => new Date(t.departureAt) >= new Date())
    .slice(0, 5);

  const recentBookings = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 500,
            marginBottom: "0.25rem",
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: "var(--brand-gray)", fontSize: "0.875rem" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            label: "Total bookings",
            value: stats.totalBookings,
            color: "var(--brand-dark)",
          },
          {
            label: "Confirmed",
            value: stats.confirmedBookings,
            color: "#1a6b4a",
          },
          {
            label: "Pending payment",
            value: stats.pendingBookings,
            color: "#b07d00",
          },
          {
            label: "Today's bookings",
            value: stats.todayBookings,
            color: "#185FA5",
          },
          {
            label: "Total revenue",
            value: "$" + stats.totalRevenue,
            color: "#1a6b4a",
          },
          {
            label: "Upcoming trips",
            value: trips.filter((t) => new Date(t.departureAt) >= new Date())
              .length,
            color: "var(--brand-dark)",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--surface)",
              borderRadius: "14px",
              padding: "1.25rem",
              border: "1px solid var(--border-strong)",
            }}
          >
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: 600,
                color: s.color,
                lineHeight: 1,
                marginBottom: "6px",
              }}
            >
              {loading ? "-" : s.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--brand-gray)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Recent bookings */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "16px",
            border: "1px solid var(--border-strong)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-soft)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 500 }}>
              Recent bookings
            </h2>
            <a
              href="/bookings"
              style={{
                fontSize: "0.8rem",
                color: "var(--brand-green)",
                textDecoration: "none",
              }}
            >
              View all -
            </a>
          </div>
          {loading ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--brand-gray)",
                fontSize: "0.875rem",
              }}
            >
              Loading...
            </div>
          ) : recentBookings.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--brand-gray)",
                fontSize: "0.875rem",
              }}
            >
              No bookings yet
            </div>
          ) : (
            recentBookings.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: "0.875rem 1.5rem",
                  borderBottom: "1px solid var(--border-soft)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      marginBottom: "2px",
                    }}
                  >
                    {outboundLeg(b)?.trip?.route?.origin} -{" "}
                    {outboundLeg(b)?.trip?.route?.destination}
                    {b.tripType === "ROUND_TRIP" && " (round trip)"}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}
                  >
                    {b.id.slice(0, 8).toUpperCase()} - {b.passengers} pax
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--brand-green)",
                      marginBottom: "2px",
                    }}
                  >
                    ${b.totalAmount}
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upcoming trips */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "16px",
            border: "1px solid var(--border-strong)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-soft)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 500 }}>
              Upcoming trips
            </h2>
            <a
              href="/trips"
              style={{
                fontSize: "0.8rem",
                color: "var(--brand-green)",
                textDecoration: "none",
              }}
            >
              View all -
            </a>
          </div>
          {loading ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--brand-gray)",
                fontSize: "0.875rem",
              }}
            >
              Loading...
            </div>
          ) : upcomingTrips.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--brand-gray)",
                fontSize: "0.875rem",
              }}
            >
              No upcoming trips
            </div>
          ) : (
            upcomingTrips.map((t) => {
              const dep = new Date(t.departureAt);
              return (
                <div
                  key={t.id}
                  style={{
                    padding: "0.875rem 1.5rem",
                    borderBottom: "1px solid var(--border-soft)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        marginBottom: "2px",
                      }}
                    >
                      {t.route?.origin} - {t.route?.destination}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--brand-gray)",
                      }}
                    >
                      {dep.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      -{" "}
                      {dep.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        marginBottom: "2px",
                      }}
                    >
                      {t.bookedSeats}/{t.capacity}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--brand-gray)",
                      }}
                    >
                      seats
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    CONFIRMED: { bg: "#f0faf5", color: "#1a6b4a" },
    PENDING: { bg: "#fff8e6", color: "#b07d00" },
    CANCELLED: { bg: "#fff0f0", color: "#c0392b" },
  };
  const s = map[status] || map.PENDING;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 8px",
        borderRadius: "100px",
        fontSize: "0.7rem",
        fontWeight: 500,
      }}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}


