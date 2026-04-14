"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const STATUS_FILTER = ["ALL", "CONFIRMED", "PENDING", "CANCELLED"];

export default function BookingsContent() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/bookings/user/all")
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "ALL" || b.status === filter;
    const matchSearch =
      search === "" ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.trip?.route?.origin?.toLowerCase().includes(search.toLowerCase()) ||
      b.trip?.route?.destination?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div
        style={{
          marginBottom: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500 }}>Bookings</h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            placeholder="Search by ID or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #e0ddd6",
              fontSize: "0.875rem",
              fontFamily: "DM Sans, sans-serif",
              outline: "none",
              background: "#fff",
              width: "220px",
            }}
          />
          <div style={{ display: "flex", gap: "4px" }}>
            {STATUS_FILTER.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "7px",
                  border: "1px solid",
                  borderColor: filter === s ? "var(--brand-green)" : "#e0ddd6",
                  background: filter === s ? "var(--brand-green)" : "#fff",
                  color: filter === s ? "#fff" : "var(--brand-gray)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e8e4dc",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 80px 80px 90px 100px",
            padding: "0.875rem 1.5rem",
            borderBottom: "1px solid #f0ece4",
            fontSize: "0.75rem",
            color: "var(--brand-gray)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <span>Route</span>
          <span>Departure</span>
          <span>Type</span>
          <span>Pax</span>
          <span>Amount</span>
          <span>Status</span>
        </div>

        {loading && (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--brand-gray)",
              fontSize: "0.875rem",
            }}
          >
            Loading bookings...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--brand-gray)",
              fontSize: "0.875rem",
            }}
          >
            No bookings found
          </div>
        )}

        {!loading &&
          filtered.map((b, i) => {
            const dep = new Date(b.trip?.departureAt);
            const statusMap: Record<string, { bg: string; color: string }> = {
              CONFIRMED: { bg: "#f0faf5", color: "#1a6b4a" },
              PENDING: { bg: "#fff8e6", color: "#b07d00" },
              CANCELLED: { bg: "#fff0f0", color: "#c0392b" },
            };
            const s = statusMap[b.status] || statusMap.PENDING;

            return (
              <div
                key={b.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 80px 80px 90px 100px",
                  padding: "0.875rem 1.5rem",
                  alignItems: "center",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #f5f2ec" : "none",
                  fontSize: "0.875rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: "2px" }}>
                    {b.trip?.route?.origin} → {b.trip?.route?.destination}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}
                  >
                    {b.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: "2px" }}>
                    {dep.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}
                  >
                    {dep.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span
                  style={{ fontSize: "0.8rem", color: "var(--brand-gray)" }}
                >
                  {b.type}
                </span>
                <span>{b.passengers}</span>
                <span style={{ fontWeight: 600, color: "var(--brand-green)" }}>
                  ${b.totalAmount}
                </span>
                <span
                  style={{
                    background: s.bg,
                    color: s.color,
                    padding: "3px 10px",
                    borderRadius: "100px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    display: "inline-block",
                  }}
                >
                  {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
