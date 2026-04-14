"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ROUTES = [
  {
    value: "tamarindo-liberia-airport",
    label: "Tamarindo → Liberia Airport (LIR)",
  },
  {
    value: "liberia-airport-tamarindo",
    label: "Liberia Airport (LIR) → Tamarindo",
  },
  { value: "tamarindo-arenal", label: "Tamarindo → Arenal" },
  { value: "tamarindo-monteverde", label: "Tamarindo → Monteverde" },
  { value: "tamarindo-san-jose", label: "Tamarindo → San José" },
  { value: "tamarindo-nosara", label: "Tamarindo → Nosara" },
];

export default function BookingSearch() {
  const router = useRouter();
  const [route, setRoute] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPass] = useState("1");
  const [type, setType] = useState<"SHARED" | "PRIVATE">("SHARED");

  const today = new Date().toISOString().split("T")[0];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!route || !date) return;
    router.push(
      `/book?route=${route}&date=${date}&passengers=${passengers}&type=${type}`,
    );
  }

  return (
    <section
      id="book"
      style={{
        background: "#fff",
        padding: "4rem 2rem",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "2rem",
            marginBottom: "0.5rem",
            color: "var(--brand-dark)",
          }}
        >
          Find Your Transfer
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--brand-gray)",
            marginBottom: "2.5rem",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Select your route, date and number of passengers
        </p>

        {/* Type toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0",
            marginBottom: "2rem",
          }}
        >
          {(["SHARED", "PRIVATE"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: "10px 28px",
                border: "1px solid var(--brand-green)",
                background: type === t ? "var(--brand-green)" : "transparent",
                color: type === t ? "#fff" : "var(--brand-green)",
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.9rem",
                borderRadius: t === "SHARED" ? "8px 0 0 8px" : "0 8px 8px 0",
                fontWeight: 500,
              }}
            >
              {t === "SHARED" ? "Shared Shuttle" : "Private Transfer"}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSearch}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Route</label>
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">Select route...</option>
              {ROUTES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {type === "SHARED" && (
            <div>
              <label style={labelStyle}>Passengers</label>
              <select
                value={passengers}
                onChange={(e) => setPass(e.target.value)}
                style={inputStyle}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "passenger" : "passengers"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "var(--brand-green)",
              color: "#fff",
              padding: "14px 24px",
              borderRadius: "var(--radius)",
              border: "none",
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "1rem",
              fontWeight: 500,
              height: "50px",
            }}
          >
            Search Trips
          </button>
        </form>
      </div>
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 500,
  color: "var(--brand-gray)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: "DM Sans, sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1px solid #e0ddd6",
  fontSize: "0.95rem",
  fontFamily: "DM Sans, sans-serif",
  color: "var(--brand-dark)",
  background: "#fafaf8",
  height: "50px",
  outline: "none",
};
