"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function TripsContent() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/trips")
      .then((data) => setTrips(Array.isArray(data) ? data : []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = trips.filter(
    (t) =>
      search === "" ||
      t.route?.origin?.toLowerCase().includes(search.toLowerCase()) ||
      t.route?.destination?.toLowerCase().includes(search.toLowerCase()),
  );

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
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500 }}>Trips</h1>
        <input
          placeholder="Search by route..."
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
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e8e4dc",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.2fr 100px 100px 100px 80px",
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
          <span>Seats</span>
          <span>Shared $</span>
          <span>Private $</span>
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
            Loading trips...
          </div>
        )}

        {!loading &&
          filtered.map((t, i) => {
            const dep = new Date(t.departureAt);
            const available = t.capacity - t.bookedSeats;
            const occupancy = Math.round((t.bookedSeats / t.capacity) * 100);

            return (
              <div
                key={t.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.2fr 100px 100px 100px 80px",
                  padding: "0.875rem 1.5rem",
                  alignItems: "center",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #f5f2ec" : "none",
                  fontSize: "0.875rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: "2px" }}>
                    {t.route?.origin} → {t.route?.destination}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}
                  >
                    {t.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: "2px" }}>
                    {dep.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
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
                <div>
                  <div style={{ marginBottom: "4px", fontWeight: 500 }}>
                    <span
                      style={{
                        color:
                          available <= 2 ? "#c0392b" : "var(--brand-green)",
                      }}
                    >
                      {available}
                    </span>
                    <span
                      style={{ color: "var(--brand-gray)", fontWeight: 400 }}
                    >
                      /{t.capacity}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: "#f0ece4",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "2px",
                        width: occupancy + "%",
                        background:
                          occupancy > 80
                            ? "#c0392b"
                            : occupancy > 50
                              ? "#e67e22"
                              : "var(--brand-green)",
                      }}
                    />
                  </div>
                </div>
                <span style={{ color: "var(--brand-green)", fontWeight: 600 }}>
                  ${t.priceShared}
                </span>
                <span style={{ color: "var(--brand-gray)" }}>
                  ${t.pricePrivate}
                </span>
                <span
                  style={{
                    background:
                      t.status === "SCHEDULED" ? "#f0faf5" : "#fff0f0",
                    color: t.status === "SCHEDULED" ? "#1a6b4a" : "#c0392b",
                    padding: "3px 10px",
                    borderRadius: "100px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
