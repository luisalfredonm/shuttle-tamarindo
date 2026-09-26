"use client";
import { cloneElement, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";
import { MapPin, CalendarDays, Clock, Users, Baby, Search } from "lucide-react";
import { DEFAULT_PRICING, getPricing, type Route } from "@/lib/api";
import { range } from "@/lib/private-price";
import { daysPhrase, isEveryDay } from "@/lib/days";

/**
 * Ruta que deshace el camino de la dada, si esta cargada.
 *
 * Se calcula sobre las rutas de la base y no sobre una lista fija: dar de alta
 * el regreso en el panel alcanza para que aparezca el ida y vuelta.
 */
function findReverse(routes: Route[], slug: string): Route | undefined {
  const route = routes.find((r) => r.slug === slug);
  if (!route) return undefined;

  return routes.find(
    (r) =>
      r.slug !== route.slug &&
      r.origin === route.destination &&
      r.destination === route.origin,
  );
}

/** Debe coincidir con SHARED_MIN_PASSENGERS del API */
const SHARED_MIN_PASSENGERS = 3;

export default function BookingSearch({ routes = [] }: { routes?: Route[] }) {
  const router = useRouter();
  const [route, setRoute] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPass] = useState("1");
  const [infants, setInfants] = useState("0");
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [type, setType] = useState<"SHARED" | "PRIVATE">("SHARED");
  const [tripType, setTripType] = useState<"ONE_WAY" | "ROUND_TRIP">("ONE_WAY");
  const [returnDate, setReturnDate] = useState("");
  // Privado va en vehículo exclusivo: el cliente elige cualquier hora,
  // no un horario precargado como en compartido
  const [time, setTime] = useState("");
  const [returnTime, setReturnTime] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const isPrivate = type === "PRIVATE";

  /**
   * Qué rutas se pueden elegir en cada modo.
   *
   * Privado va en vehículo exclusivo a la hora que el cliente pida, así que
   * sirve cualquier ruta activa. Compartido necesita salidas ya publicadas, y
   * esas sólo existen donde la ruta tiene horarios cargados.
   */
  const availableRoutes = useMemo(
    () => (isPrivate ? routes : routes.filter((r) => r.sharedEnabled)),
    [routes, isPrivate],
  );

  // Al cambiar de modo, la ruta elegida puede dejar de ofrecerse: se limpia
  // para no mandar a buscar algo que no se vende de esa forma.
  useEffect(() => {
    if (route && !availableRoutes.some((r) => r.slug === route)) {
      setRoute("");
    }
  }, [availableRoutes, route]);

  useEffect(() => {
    getPricing().then(setPricing);
  }, []);

  // La van lleva hasta vehicleCapacity personas contando infantes. Lo que ya
  // no entra (p. ej. 10 pasajeros de compartido al pasar a privado) se recorta
  // al leerlo, sin tocar lo que eligió el visitante
  const capacity = pricing.vehicleCapacity;
  const paxCount = isPrivate
    ? Math.min(Number(passengers), capacity)
    : Number(passengers);
  const maxInfants = Math.max(0, capacity - paxCount);
  const infantCount = Math.min(Number(infants), maxInfants);

  // Solo hay ida y vuelta donde el regreso también está disponible en este
  // modo, y en privado además hace falta que la ruta tenga su precio propio
  const selected = routes.find((r) => r.slug === route);
  const reverse = route ? findReverse(availableRoutes, route) : undefined;
  const canRoundTrip =
    !!reverse && (!isPrivate || selected?.pricePrivateRoundTrip != null);
  const isRoundTrip = canRoundTrip && tripType === "ROUND_TRIP";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!route || !date) return;
    if (isRoundTrip && !returnDate) return;
    if (isPrivate && !time) return;
    if (isPrivate && isRoundTrip && !returnTime) return;

    const params = new URLSearchParams({
      route,
      date,
      passengers: String(paxCount),
      type,
    });
    if (isRoundTrip) {
      params.set("tripType", "ROUND_TRIP");
      params.set("returnDate", returnDate);
    }
    if (isPrivate) {
      params.set("time", time);
      if (isRoundTrip) params.set("returnTime", returnTime);
      if (infantCount > 0) params.set("infants", String(infantCount));
    }
    router.push(`/book?${params}`);
  }

  return (
    <section id="book" style={{ background: "#fdfcfa", padding: "5.5rem 2rem" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <Reveal amount={0.3} y={28}
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
              Book your Tamarindo shuttle
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

          {/* Type toggle: el fondo de la opción activa hace un fundido por CSS */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div style={segmentTrackStyle}>
              {(["SHARED", "PRIVATE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={segmentButtonStyle(type === t)}
                >
                  <span style={segmentLabelStyle}>
                    {t === "SHARED" ? <Users size={15} strokeWidth={2} /> : <MapPin size={15} strokeWidth={2} />}
                    {t === "SHARED" ? "Shared Shuttle" : "Private Transfer"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Un modo sin rutas no deja al visitante frente a un desplegable
              muerto: se le dice por qué y adónde ir */}
          {availableRoutes.length === 0 && (
            <p style={emptyNoticeStyle}>
              {routes.length === 0
                ? "Routes are unavailable right now. Please try again in a moment."
                : "No shared departures are scheduled at the moment. Switch to Private Transfer to book a vehicle at the time you need."}
            </p>
          )}

          {/* Ida / ida y vuelta. Se muestra solo cuando la ruta inversa existe */}
          {canRoundTrip && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
              <div style={{ ...segmentTrackStyle, background: "#f5f2ec" }}>
                {(["ONE_WAY", "ROUND_TRIP"] as const).map((tt) => (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => setTripType(tt)}
                    style={segmentButtonStyle(tripType === tt, "var(--brand-dark)")}
                  >
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
                disabled={availableRoutes.length === 0}
              >
                <option value="">
                  {availableRoutes.length === 0
                    ? isPrivate
                      ? "No routes available"
                      : "No shared routes right now"
                    : "Select route..."}
                </option>
                {availableRoutes.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.origin} → {r.destination}
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

            <Field
              label={isPrivate ? "Passengers (age 3+)" : "Passengers"}
              icon={<Users size={16} strokeWidth={2} />}
            >
              <select
                value={paxCount}
                onChange={(e) => setPass(e.target.value)}
                style={inputStyle}
                className="rst-field"
              >
                {range(1, isPrivate ? capacity : 10).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "passenger" : "passengers"}
                  </option>
                ))}
              </select>
            </Field>

            {isPrivate && (
              <Field label="Infants (0–2)" icon={<Baby size={16} strokeWidth={2} />}>
                <select
                  value={infantCount}
                  onChange={(e) => setInfants(e.target.value)}
                  style={inputStyle}
                  className="rst-field"
                >
                  {range(0, maxInfants).map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "No infants" : `${n} ${n === 1 ? "infant" : "infants"}`}
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

          {/* La regla del mínimo se explica acá, que es donde se elige cuántos
              viajan. Enterarse recién en los resultados llega tarde. */}
          {type === "SHARED" && paxCount < SHARED_MIN_PASSENGERS && (
            <p style={minNoticeStyle}>
              Travelling with fewer than {SHARED_MIN_PASSENGERS}? You can join
              any departure that is already running. If none is running that
              day, booking {SHARED_MIN_PASSENGERS} seats starts one — or take a
              private transfer at any time.
            </p>
          )}

          {/* Se avisa antes de elegir fecha: enterarse en los resultados de
              que ese día no sale obliga a volver atrás */}
          {!isPrivate && selected && !isEveryDay(selected.sharedDays) && (
            <p style={{ ...minNoticeStyle, color: "var(--brand-dark)", fontWeight: 500 }}>
              The shared shuttle on this route runs on{" "}
              {daysPhrase(selected.sharedDays!)}.
            </p>
          )}

          {isPrivate && (
            <p style={minNoticeStyle}>
              Private price covers up to {pricing.includedPassengers} passengers;
              each additional passenger is ${pricing.extraPassengerPrice}.
              Infants (0–2) ride free but need a seat. Up to {capacity} people
              per van.
            </p>
          )}
        </Reveal>
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

/**
 * Etiqueta + campo, atados por id.
 *
 * El id se genera acá y se le inyecta al control: sin htmlFor, un lector de
 * pantalla anuncia "combo box" sin decir de qué, y el usuario no sabe si está
 * eligiendo la ruta, la fecha o los pasajeros.
 */
function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactElement<{ id?: string }>;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        <span style={{ display: "inline-flex", color: "var(--brand-gold)" }}>{icon}</span>
        {label}
      </label>
      {cloneElement(children, { id })}
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

const minNoticeStyle: React.CSSProperties = {
  marginTop: "1.1rem",
  textAlign: "center",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.82rem",
  lineHeight: 1.6,
  color: "var(--brand-gray)",
  maxWidth: "58ch",
  marginLeft: "auto",
  marginRight: "auto",
};

const emptyNoticeStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "0 auto 1.5rem",
  maxWidth: "46ch",
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  background: "#fdf6e8",
  border: "1px solid #f0e2c4",
  color: "#7a5c14",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.85rem",
  lineHeight: 1.5,
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

function segmentButtonStyle(
  active: boolean,
  activeBg = "var(--brand-green)",
): React.CSSProperties {
  return {
    position: "relative",
    border: "none",
    background: active ? activeBg : "transparent",
    cursor: "pointer",
    padding: "9px 20px",
    borderRadius: "9px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.88rem",
    fontWeight: 500,
    color: active ? "#fff" : "var(--brand-gray)",
    transition: "background-color 0.25s ease, color 0.25s ease",
  };
}

const segmentLabelStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
};
