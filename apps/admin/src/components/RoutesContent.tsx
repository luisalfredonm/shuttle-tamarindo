"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function RoutesContent() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/routes")
      .then((data) => setRoutes(Array.isArray(data) ? data : []))
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div
        style={{
          marginBottom: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500 }}>Routes</h1>
        <span style={{ fontSize: "0.875rem", color: "var(--brand-gray)" }}>
          {routes.length} active routes
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {loading && (
          <div
            style={{
              padding: "2rem",
              color: "var(--brand-gray)",
              fontSize: "0.875rem",
            }}
          >
            Loading routes...
          </div>
        )}
        {!loading &&
          routes.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "1.5rem",
                border: "1px solid #e8e4dc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: "0.95rem",
                      marginBottom: "2px",
                    }}
                  >
                    {r.origin}
                  </div>
                  <div
                    style={{ color: "var(--brand-gold)", marginBottom: "2px" }}
                  >
                    ↓
                  </div>
                  <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                    {r.destination}
                  </div>
                </div>
                <span
                  style={{
                    background: r.isActive ? "#f0faf5" : "#fff0f0",
                    color: r.isActive ? "#1a6b4a" : "#c0392b",
                    padding: "3px 10px",
                    borderRadius: "100px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  {r.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #f0ece4",
                  fontSize: "0.8rem",
                  color: "var(--brand-gray)",
                }}
              >
                <span>
                  {Math.floor(r.durationMin / 60)}h{" "}
                  {r.durationMin % 60 > 0 ? (r.durationMin % 60) + "m" : ""}
                </span>
                <span>{r.distanceKm} km</span>
                <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                  {r.slug}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
