"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getTrips, getRouteBySlug, createBooking, Trip, Route } from "@/lib/api";
import { getReverseRoute } from "@/lib/routes-data";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import CancellationPolicy from "./CancellationPolicy";

/** Arma el ISO de una salida a partir de la fecha y la hora que eligió el cliente */
function buildDepartureAt(day: string, time: string) {
  return new Date(`${day}T${time}`).toISOString();
}

const ROUTE_LABELS: Record<string, string> = {
  "tamarindo-liberia-airport": "Tamarindo → Liberia Airport (LIR)",
  "liberia-airport-tamarindo": "Liberia Airport (LIR) → Tamarindo",
  "tamarindo-arenal": "Tamarindo → Arenal",
  "tamarindo-monteverde": "Tamarindo → Monteverde",
  "tamarindo-san-jose": "Tamarindo → San José",
  "tamarindo-nosara": "Tamarindo → Nosara",
};

function label(slug: string) {
  return ROUTE_LABELS[slug] || slug;
}

function longDate(value: string) {
  if (!value) return "";
  return new Date(value + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BookResults() {
  const { user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();

  const routeSlug = params.get("route") || "";
  const date = params.get("date") || "";
  const passengers = parseInt(params.get("passengers") || "1");
  const type = (params.get("type") || "SHARED") as "SHARED" | "PRIVATE";
  const returnDate = params.get("returnDate") || "";
  const isRoundTrip = params.get("tripType") === "ROUND_TRIP" && !!returnDate;
  const isPrivate = type === "PRIVATE";
  // Privado: hora exacta elegida por el cliente, no un horario de la lista
  const time = params.get("time") || "";
  const returnTime = params.get("returnTime") || "";

  const returnSlug = isRoundTrip ? getReverseRoute(routeSlug)?.slug : undefined;

  const [outbound, setOutbound] = useState<Trip[]>([]);
  const [inbound, setInbound] = useState<Trip[]>([]);
  const [outboundRoute, setOutboundRoute] = useState<Route | null>(null);
  const [inboundRoute, setInboundRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  const [pickedOut, setPickedOut] = useState<Trip | null>(null);
  const [pickedIn, setPickedIn] = useState<Trip | null>(null);

  // Datos operativos del viaje: el conductor los necesita para el pickup
  const [pickupAddress, setPickupAddress] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [tripNotes, setTripNotes] = useState("");

  // El vuelo solo aplica si alguno de los tramos toca el aeropuerto
  const showFlightNumber =
    routeSlug.includes("airport") || !!returnSlug?.includes("airport");

  // Service agreement: hay que leerlo hasta el final antes de poder marcarlo
  const agreementBoxRef = useRef<HTMLDivElement>(null);
  const [agreementScrolled, setAgreementScrolled] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const signedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function handleAgreementScroll() {
    const el = agreementBoxRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 16;
    if (atBottom) setAgreementScrolled(true);
  }

  // Si el texto ya entra sin necesitar scroll (pantalla muy alta, zoom chico),
  // no tiene sentido dejar el checkbox bloqueado esperando un scroll que nunca va a pasar
  useEffect(() => {
    handleAgreementScroll();
  }, [loading]);

  useEffect(() => {
    if (!routeSlug || !date) return;
    setLoading(true);
    setError("");

    if (isPrivate) {
      const requests: Promise<Route>[] = [getRouteBySlug(routeSlug)];
      if (isRoundTrip && returnSlug) requests.push(getRouteBySlug(returnSlug));

      Promise.all(requests)
        .then(([out, back]) => {
          setOutboundRoute(out);
          setInboundRoute(back ?? null);
        })
        .catch(() => setError("Could not load route pricing. Please try again."))
        .finally(() => setLoading(false));
      return;
    }

    const requests: Promise<Trip[]>[] = [getTrips({ routeSlug, date })];
    if (isRoundTrip && returnSlug) {
      requests.push(getTrips({ routeSlug: returnSlug, date: returnDate }));
    }

    Promise.all(requests)
      .then(([out, back]) => {
        setOutbound(out);
        setInbound(back ?? []);
      })
      .catch(() => setError("Could not load trips. Please try again."))
      .finally(() => setLoading(false));
  }, [routeSlug, date, returnSlug, returnDate, isRoundTrip, isPrivate]);

  const legPrice = (trip: Trip) => Number(trip.priceShared) * passengers;

  const total = isPrivate
    ? (outboundRoute ? Number(outboundRoute.pricePrivate) : 0) +
      (isRoundTrip && inboundRoute ? Number(inboundRoute.pricePrivate) : 0)
    : (pickedOut ? legPrice(pickedOut) : 0) + (pickedIn ? legPrice(pickedIn) : 0);

  const ready =
    !!pickupAddress.trim() &&
    agreementChecked &&
    !!signatureName.trim() &&
    (isPrivate
      ? !!date && !!time && !!outboundRoute &&
        (!isRoundTrip || (!!returnDate && !!returnTime && !!inboundRoute))
      : !!pickedOut && (!isRoundTrip || !!pickedIn));

  async function handleConfirm() {
    if (!ready) return;

    // Reservar exige sesión: el backend saca el userId del JWT.
    // Volvemos a esta misma búsqueda después del login.
    if (!user) {
      const returnTo = `/book?${params.toString()}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    setBooking(true);
    setError("");
    try {
      const tripDetails = {
        pickupAddress: pickupAddress.trim(),
        flightNumber: showFlightNumber ? flightNumber.trim() || undefined : undefined,
        notes: tripNotes.trim() || undefined,
        agreementSignedName: signatureName.trim(),
      };

      const b = isPrivate
        ? await createBooking({
            type,
            passengers,
            routeSlug,
            departureAt: buildDepartureAt(date, time),
            ...(isRoundTrip && returnSlug
              ? {
                  returnRouteSlug: returnSlug,
                  returnDepartureAt: buildDepartureAt(returnDate, returnTime),
                }
              : {}),
            ...tripDetails,
          })
        : await createBooking({
            tripId: pickedOut!.id,
            returnTripId: isRoundTrip && pickedIn ? pickedIn.id : undefined,
            type,
            passengers,
            ...tripDetails,
          });
      router.push(`/confirmation?bookingId=${b.id}`);
    } catch (e: any) {
      setError(e.message || "Booking failed. Please try again.");
      setBooking(false);
    }
  }

  function renderLeg(
    heading: string,
    slug: string,
    day: string,
    list: Trip[],
    picked: Trip | null,
    pick: (t: Trip) => void,
  ) {
    return (
      <section style={{ marginBottom: "2.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div style={eyebrowStyle}>{heading}</div>
          <h2 style={{ fontSize: "1.15rem", margin: "2px 0 2px" }}>
            {label(slug)}
          </h2>
          <p
            style={{
              color: "var(--brand-gray)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.85rem",
            }}
          >
            {longDate(day)}
          </p>
        </div>

        {list.length === 0 ? (
          <div style={emptyStyle}>
            No departures on this date. Try another day or contact us.
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {list.map((trip) => {
              const depTime = new Date(trip.departureAt).toLocaleTimeString(
                "en-US",
                { hour: "2-digit", minute: "2-digit", hour12: true },
              );
              const isSelected = picked?.id === trip.id;
              const isFull =
                type === "SHARED"
                  ? trip.availableSeats < passengers
                  : trip.bookedSeats > 0;

              // Con menos del mínimo confirmado, un grupo chico no puede sumarse:
              // tiene que abrir la salida reservando el mínimo
              const needsToOpen =
                type === "SHARED" &&
                !trip.sharedOpen &&
                passengers < trip.sharedMinPassengers;

              const blocked = isFull || needsToOpen;

              return (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => !blocked && pick(trip)}
                  disabled={blocked}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    background: "#fff",
                    borderRadius: "14px",
                    padding: "1.15rem 1.35rem",
                    border: isSelected
                      ? "2px solid var(--brand-green)"
                      : "1px solid #e8e4dc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                    cursor: blocked ? "not-allowed" : "pointer",
                    opacity: blocked ? 0.55 : 1,
                    font: "inherit",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}
                  >
                    <div>
                      <div style={eyebrowStyle}>Departure</div>
                      <div
                        style={{
                          fontSize: "1.4rem",
                          fontFamily: "Playfair Display, serif",
                          fontWeight: 600,
                          color: "var(--brand-dark)",
                        }}
                      >
                        {depTime}
                      </div>
                    </div>

                    {type === "SHARED" && (
                      <div>
                        <div style={eyebrowStyle}>Status</div>
                        <div
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            color: trip.sharedOpen
                              ? "var(--brand-green)"
                              : "#b06d1e",
                          }}
                        >
                          {trip.sharedOpen
                            ? `${trip.confirmedSeats} confirmed · join in`
                            : `Needs ${trip.sharedMinPassengers} to open`}
                        </div>
                      </div>
                    )}

                    <div>
                      <div style={eyebrowStyle}>Seats left</div>
                      <div
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontWeight: 500,
                          fontSize: "0.95rem",
                        }}
                      >
                        {trip.availableSeats} / {trip.capacity}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "1.4rem",
                        fontFamily: "Playfair Display, serif",
                        fontWeight: 600,
                        color: "var(--brand-green)",
                      }}
                    >
                      ${legPrice(trip)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--brand-gray)",
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      {isSelected
                        ? "Selected"
                        : blocked
                          ? needsToOpen
                            ? `Book ${trip.sharedMinPassengers} to open`
                            : "Not available"
                          : "Select"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  // Privado no lista horarios: el cliente ya eligió la hora en el buscador,
  // acá solo se confirma contra el precio fijo de la ruta
  function renderPrivateLeg(
    heading: string,
    slug: string,
    day: string,
    pickupTime: string,
    routeData: Route | null,
  ) {
    const depLabel = pickupTime
      ? new Date(`${day}T${pickupTime}`).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "";

    return (
      <section style={{ marginBottom: "2.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div style={eyebrowStyle}>{heading}</div>
          <h2 style={{ fontSize: "1.15rem", margin: "2px 0 2px" }}>
            {label(slug)}
          </h2>
          <p
            style={{
              color: "var(--brand-gray)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.85rem",
            }}
          >
            {longDate(day)}
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "1.15rem 1.35rem",
            border: "2px solid var(--brand-green)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={eyebrowStyle}>Pickup time</div>
            <div
              style={{
                fontSize: "1.4rem",
                fontFamily: "Playfair Display, serif",
                fontWeight: 600,
                color: "var(--brand-dark)",
              }}
            >
              {depLabel || "—"}
            </div>
          </div>

          <div
            style={{
              fontSize: "1.4rem",
              fontFamily: "Playfair Display, serif",
              fontWeight: 600,
              color: "var(--brand-green)",
            }}
          >
            {routeData ? `$${routeData.pricePrivate}` : "—"}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem" }}>
      <Link
        href="/"
        style={{
          color: "var(--brand-green)",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.9rem",
          textDecoration: "none",
          display: "inline-block",
          marginBottom: "1.5rem",
        }}
      >
        ← Back to home
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>
        {isPrivate
          ? "Confirm your private pickup"
          : isRoundTrip
            ? "Choose both departures"
            : "Choose your departure"}
      </h1>
      <p
        style={{
          color: "var(--brand-gray)",
          fontFamily: "DM Sans, sans-serif",
          marginBottom: "2rem",
        }}
      >
        {type === "SHARED"
          ? `${passengers} passenger${passengers > 1 ? "s" : ""} · Shared shuttle`
          : "Private transfer · full vehicle"}
      </p>

      {type === "SHARED" && (
        <div style={noticeStyle}>
          Shared departures open with 3 passengers. Once a departure is open,
          anyone can join it on their own — and we never cancel a departure that
          is already running.
        </div>
      )}

      {isPrivate && (
        <div style={noticeStyle}>
          Private transfers use an exclusive vehicle at the exact time you
          requested — no shared schedule, no minimum passengers.
        </div>
      )}

      {error && <div style={errorStyle}>{error}</div>}

      {loading ? (
        <div style={emptyStyle}>
          {isPrivate ? "Loading pricing..." : "Loading available trips..."}
        </div>
      ) : (
        <>
          {isPrivate ? (
            <>
              {renderPrivateLeg(
                isRoundTrip ? "Outbound" : "Pickup",
                routeSlug,
                date,
                time,
                outboundRoute,
              )}

              {isRoundTrip &&
                returnSlug &&
                renderPrivateLeg(
                  "Return",
                  returnSlug,
                  returnDate,
                  returnTime,
                  inboundRoute,
                )}
            </>
          ) : (
            <>
              {renderLeg(
                isRoundTrip ? "Outbound" : "Departure",
                routeSlug,
                date,
                outbound,
                pickedOut,
                setPickedOut,
              )}

              {isRoundTrip &&
                returnSlug &&
                renderLeg(
                  "Return",
                  returnSlug,
                  returnDate,
                  inbound,
                  pickedIn,
                  setPickedIn,
                )}
            </>
          )}

          {/* Datos que el conductor necesita para el pickup; no se piden en
              el buscador porque ahí todavía no sabemos si va a haber reserva */}
          <section style={{ marginBottom: "2.5rem" }}>
            <div style={eyebrowStyle}>Trip details</div>
            <h2 style={{ fontSize: "1.15rem", margin: "2px 0 1rem" }}>
              Where should we pick you up?
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label style={fieldLabelStyle}>Hotel / address *</label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Hotel name or full address"
                  style={fieldStyle}
                />
              </div>

              {showFlightNumber && (
                <div>
                  <label style={fieldLabelStyle}>
                    Flight number (if arriving/departing by air)
                  </label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g. AA 1234"
                    style={fieldStyle}
                  />
                </div>
              )}

              <div>
                <label style={fieldLabelStyle}>Anything else? (optional)</label>
                <textarea
                  value={tripNotes}
                  onChange={(e) => setTripNotes(e.target.value)}
                  placeholder="Extra luggage, special requests, group details..."
                  rows={3}
                  style={{ ...fieldStyle, resize: "vertical" }}
                />
              </div>
            </div>
          </section>

          {/* Hay que leer la política hasta el final antes de poder firmar */}
          <section style={{ marginBottom: "2.5rem" }}>
            <div style={eyebrowStyle}>Service agreement</div>
            <h2 style={{ fontSize: "1.15rem", margin: "2px 0 1rem" }}>
              Cancellation &amp; no-show policy
            </h2>

            <div
              ref={agreementBoxRef}
              onScroll={handleAgreementScroll}
              style={{
                background: "#fff",
                border: "1px solid #e8e4dc",
                borderRadius: "12px",
                padding: "1.25rem 1.5rem",
                height: "260px",
                overflowY: "auto",
              }}
            >
              <CancellationPolicy />
            </div>

            {!agreementScrolled ? (
              <div
                style={{
                  ...noticeStyle,
                  marginTop: "0.75rem",
                  marginBottom: 0,
                  textAlign: "center",
                }}
              >
                ↓ Scroll to the bottom of the agreement to enable the checkbox
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginTop: "0.9rem",
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--brand-dark)",
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  style={{ marginTop: "3px" }}
                />
                I agree to the terms of service. I understand that
                cancellations made less than 48 hours before departure are
                non-refundable and no-shows may be charged the full amount on
                file.
              </label>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <div>
                <label style={fieldLabelStyle}>
                  Signature: type your full name
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  disabled={!agreementChecked}
                  placeholder="Type your full name"
                  style={{
                    ...fieldStyle,
                    opacity: agreementChecked ? 1 : 0.6,
                  }}
                />
              </div>
              <div>
                <label style={fieldLabelStyle}>Date signed</label>
                <input
                  type="text"
                  value={signedDate}
                  disabled
                  style={{ ...fieldStyle, opacity: 0.6 }}
                />
              </div>
            </div>
          </section>

          {/* Resumen: en ida y vuelta no se puede confirmar con un solo tramo */}
          <div style={summaryStyle}>
            <div>
              <div style={{ ...eyebrowStyle, color: "rgba(255,255,255,0.45)" }}>
                Total
              </div>
              <div
                style={{
                  fontSize: "1.9rem",
                  fontFamily: "Playfair Display, serif",
                  fontWeight: 600,
                  color: "var(--brand-gold)",
                }}
              >
                ${total}
              </div>
              {isRoundTrip && (
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  {(isPrivate ? !!outboundRoute : !!pickedOut)
                    ? "Outbound ✓"
                    : "Outbound pending"}{" "}
                  ·{" "}
                  {(isPrivate ? !!inboundRoute : !!pickedIn)
                    ? "Return ✓"
                    : "Return pending"}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!ready || booking}
              className="hero-cta"
              style={{
                background: ready ? "var(--brand-gold)" : "rgba(255,255,255,.2)",
                color: ready ? "var(--brand-dark)" : "rgba(255,255,255,.6)",
                border: "none",
                borderRadius: "var(--radius)",
                padding: "14px 30px",
                cursor: ready && !booking ? "pointer" : "not-allowed",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
                fontSize: "1rem",
              }}
            >
              {booking ? "Booking..." : "Continue"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  color: "var(--brand-gray)",
  fontFamily: "DM Sans, sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  marginBottom: "2px",
};

const emptyStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "2.5rem",
  background: "#fff",
  borderRadius: "14px",
  border: "1px solid #e8e4dc",
  color: "var(--brand-gray)",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.9rem",
};

const noticeStyle: React.CSSProperties = {
  background: "#fdf6e9",
  border: "1px solid #f0dfba",
  borderRadius: "10px",
  padding: "0.85rem 1.1rem",
  marginBottom: "2rem",
  color: "#7a5a1e",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.85rem",
  lineHeight: 1.6,
};

const errorStyle: React.CSSProperties = {
  background: "#fff0f0",
  border: "1px solid #ffc5c5",
  borderRadius: "10px",
  padding: "1rem 1.25rem",
  marginBottom: "1.5rem",
  color: "#c0392b",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.9rem",
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 500,
  color: "var(--brand-gray)",
  marginBottom: "6px",
  fontFamily: "DM Sans, sans-serif",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1px solid #e0ddd6",
  fontSize: "0.95rem",
  fontFamily: "DM Sans, sans-serif",
  color: "var(--brand-dark)",
  background: "#fafaf8",
  outline: "none",
  boxSizing: "border-box",
};

const summaryStyle: React.CSSProperties = {
  position: "sticky",
  bottom: "1rem",
  background: "var(--brand-dark)",
  borderRadius: "16px",
  padding: "1.25rem 1.5rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1rem",
};
