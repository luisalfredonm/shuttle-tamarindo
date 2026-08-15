"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, CalendarDays, Clock, Users, Search } from "lucide-react";
import { getReverseRoute } from "@/lib/routes-data";

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
  const reduceMotion = useReducedMotion();
  const [route, setRoute] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPass] = useState("1");
  const [type, setType] = useState<"SHARED" | "PRIVATE">("SHARED");
  const [tripType, setTripType] = useState<"ONE_WAY" | "ROUND_TRIP">("ONE_WAY");
  const [returnDate, setReturnDate] = useState("");
  // Privado va en vehículo exclusivo: el cliente elige cualquier hora,
  // no un horario precargado como en compartido
  const [time, setTime] = useState("");
  const [returnTime, setReturnTime] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Solo hay ida y vuelta donde existe la ruta inversa cargada
  const reverse = route ? getReverseRoute(route) : undefined;
  const canRoundTrip = !!reverse;
  const isRoundTrip = canRoundTrip && tripType === "ROUND_TRIP";

  const isPrivate = type === "PRIVATE";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!route || !date) return;
    if (isRoundTrip && !returnDate) return;
    if (isPrivate && !time) return;
    if (isPrivate && isRoundTrip && !returnTime) return;

    const params = new URLSearchParams({ route, date, passengers, type });
    if (isRoundTrip) {
      params.set("tripType", "ROUND_TRIP");
      params.set("returnDate", returnDate);
    }
    if (isPrivate) {
      params.set("time", time);
      if (isRoundTrip) params.set("returnTime", returnTime);
    }
    router.push(`/book?${params}`);
  }

  return (
    <section id="book" style={{ background: "#fdfcfa", padding: "5.5rem 2rem" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "#fff",
            borderRadius: "24px",
            borderTop: "3px solid var(--brand-gold)",
            boxShadow: "0 24px 60px -20px rgba(13,31,23,0.22)",
            padding: "clamp(1.75rem, 4vw, 3rem)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                fontWeight: 600,
                color: "var(--brand-dark)",
                marginBottom: "0.5rem",
              }}
            >
              Find Your Transfer
            </h2>
            <p
              style={{
                color: "var(--brand-gray)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.95rem",
              }}
            >
              Select your route, date and number of passengers
            </p>
          </div>

          {/* Type toggle: pill de fondo animado con el mismo layoutId para
              que se deslice entre opciones en vez de saltar */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div style={segmentTrackStyle}>
              {(["SHARED", "PRIVATE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={segmentButtonStyle(type === t)}
                >
                  {type === t && (
                    <motion.span
                      layoutId="booking-type-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      style={segmentPillStyle}
                    />
                  )}
                  <span style={segmentLabelStyle}>
                    {t === "SHARED" ? <Users size={15} strokeWidth={2} /> : <MapPin size={15} strokeWidth={2} />}
                    {t === "SHARED" ? "Shared Shuttle" : "Private Transfer"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ida / ida y vuelta. Se muestra solo cuando la ruta inversa existe */}
          {canRoundTrip && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
              <div style={{ ...segmentTrackStyle, background: "#f5f2ec" }}>
                {(["ONE_WAY", "ROUND_TRIP"] as const).map((tt) => (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => setTripType(tt)}
                    style={segmentButtonStyle(tripType === tt)}
                  >
                    {tripType === tt && (
                      <motion.span
                        layoutId="booking-trip-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        style={{ ...segmentPillStyle, background: "var(--brand-dark)" }}
                      />
                    )}
                    <span style={segmentLabelStyle}>
                      {tt === "ONE_WAY" ? "One way" : "Round trip"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSearch}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              alignItems: "end",
            }}
          >
            <Field label="Route" icon={<MapPin size={16} strokeWidth={2} />}>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                style={inputStyle}
                className="rst-field"
                required
              >
                <option value="">Select route...</option>
                {ROUTES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={isRoundTrip ? "Departure" : "Date"} icon={<CalendarDays size={16} strokeWidth={2} />}>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
                className="rst-field"
                required
              />
            </Field>

            {isPrivate && (
              <Field label="Pickup time" icon={<Clock size={16} strokeWidth={2} />}>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={inputStyle}
                  className="rst-field"
                  required
                />
              </Field>
            )}

            {isRoundTrip && (
              <Field label="Return" icon={<CalendarDays size={16} strokeWidth={2} />}>
                <input
                  type="date"
                  value={returnDate}
                  // El regreso nunca puede ser antes de la ida
                  min={date || today}
                  onChange={(e) => setReturnDate(e.target.value)}
                  style={inputStyle}
                  className="rst-field"
                  required
                />
              </Field>
            )}

            {isPrivate && isRoundTrip && (
              <Field label="Return pickup time" icon={<Clock size={16} strokeWidth={2} />}>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  style={inputStyle}
                  className="rst-field"
                  required
                />
              </Field>
            )}

            {type === "SHARED" && (
              <Field label="Passengers" icon={<Users size={16} strokeWidth={2} />}>
                <select
                  value={passengers}
                  onChange={(e) => setPass(e.target.value)}
                  style={inputStyle}
                  className="rst-field"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "passenger" : "passengers"}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <button type="submit" className="rst-submit" style={submitStyle}>
              <Search size={17} strokeWidth={2.25} />
              Search Trips
            </button>
          </form>
        </motion.div>
      </div>

      <style>{`
        .rst-field { transition: border-color 0.2s, box-shadow 0.2s; }
        .rst-field:focus {
          border-color: var(--brand-gold) !important;
          box-shadow: 0 0 0 3px rgba(201,151,58,0.18);
        }
        .rst-submit { transition: transform 0.15s, box-shadow 0.15s; }
        .rst-submit:hover { box-shadow: 0 10px 24px -8px rgba(26,107,74,0.5); }
        .rst-submit:active { transform: translateY(1px) scale(0.98); }
      `}</style>
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>
        <span style={{ display: "inline-flex", color: "var(--brand-gold)" }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "0.78rem",
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
  borderRadius: "10px",
  border: "1px solid #e0ddd6",
  fontSize: "0.95rem",
  fontFamily: "DM Sans, sans-serif",
  color: "var(--brand-dark)",
  background: "#fafaf8",
  height: "50px",
  outline: "none",
};

const submitStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
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
};

const segmentTrackStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  background: "#f0ece4",
  borderRadius: "12px",
  padding: "4px",
  gap: "2px",
};

function segmentButtonStyle(active: boolean): React.CSSProperties {
  return {
    position: "relative",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "9px 20px",
    borderRadius: "9px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.88rem",
    fontWeight: 500,
    color: active ? "#fff" : "var(--brand-gray)",
  };
}

const segmentPillStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "var(--brand-green)",
  borderRadius: "9px",
  zIndex: 0,
};

const segmentLabelStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
};
