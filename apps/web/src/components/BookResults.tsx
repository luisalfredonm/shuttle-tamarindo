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

  /**
   * Cuántos viajan, editable acá mismo.
   *
   * Antes venía fijo de la URL y no se podía cambiar sin volver al buscador:
   * la salida decía "reservá 3 para abrirla" y no había dónde poner ese 3.
   */
  const [passengers, setPassengers] = useState(() => {
    const n = parseInt(params.get("passengers") || "1");
    return Number.isFinite(n) && n > 0 ? n : 1;
  });

  const [pickedOut, setPickedOut] = useState<Trip | null>(null);
  const [pickedIn, setPickedIn] = useState<Trip | null>(null);

  /** Cambia el número de viajeros y lo refleja en la URL, para que el enlace siga sirviendo */
  function changePassengers(next: number) {
    setPassengers(next);

    const qs = new URLSearchParams(params.toString());
    qs.set("passengers", String(next));
    router.replace(`/book?${qs.toString()}`, { scroll: false });

    // Lo elegido puede dejar de alcanzar con el nuevo número: se suelta la
    // selección en vez de mandar a pagar algo que la API va a rechazar
    setPickedOut((prev) => (prev && prev.availableSeats < next ? null : prev));
    setPickedIn((prev) => (prev && prev.availableSeats < next ? null : prev));
  }

  /** Esta salida todavía no arranca y el grupo no alcanza para ponerla en marcha */
  const needsOpening = (trip: Trip) =>
    type === "SHARED" &&
    !trip.sharedOpen &&
    passengers < trip.sharedMinPassengers;

  /**
   * Asientos que hay que pagar en una salida concreta.
   *
   * Es propio de cada salida y no un estado de la página: la que ya está en
   * marcha cobra lo que viaja el grupo, y la que no arrancó cobra el mínimo
   * que la pone en marcha. Cuando esto vivía en el contador de pasajeros,
   * tocar una salida sin arrancar le cambiaba el precio a todas las demás y no
   * habia forma de volver atrás.
   */
  const seatsFor = (trip: Trip | null) => {
    if (!trip || isPrivate) return passengers;
    return needsOpening(trip) ? trip.sharedMinPassengers : passengers;
  };

  /**
   * Asientos de la reserva completa.
   *
   * La API cobra un solo número para todos los tramos, asi que si un tramo
   * necesita el mínimo, manda ese. Se calcula sobre lo elegido, no sobre la
   * lista entera.
   */
  const seatsToBook = Math.max(
    passengers,
    seatsFor(pickedOut),
    seatsFor(pickedIn),
  );

  /** true cuando se paga más asientos que viajeros, para poder explicarlo */
  const payingForMinimum = !isPrivate && seatsToBook > passengers;

  // Ninguna salida del día llegó al mínimo: el visitante necesita saber que
  // igual puede viajar, y con qué números
  const noneRunning =
    type === "SHARED" &&
    outbound.length > 0 &&
    !outbound.some((t) => t.sharedOpen);
  const sharedMin = outbound[0]?.sharedMinPassengers ?? 3;
  const startPrice = outbound[0]
    ? Number(outbound[0].priceShared) * sharedMin
    : 0;

  const privateHref = (() => {
    const qs = new URLSearchParams(params.toString());
    qs.set("type", "PRIVATE");
    // El privado necesita una hora concreta; sin ella el formulario la pide
    if (!qs.get("time")) qs.set("time", "09:00");
    return `/book?${qs.toString()}`;
  })();

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

  /** Lo que cuesta esta salida en particular, con sus propios asientos */
  const legPrice = (trip: Trip) => Number(trip.priceShared) * seatsFor(trip);

  // El total va con seatsToBook, que es lo que la API va a cobrar en ambos
  // tramos, y no con los asientos de cada tarjeta por separado
  const total = isPrivate
    ? (outboundRoute ? Number(outboundRoute.pricePrivate) : 0) +
      (isRoundTrip && inboundRoute ? Number(inboundRoute.pricePrivate) : 0)
    : (pickedOut ? Number(pickedOut.priceShared) * seatsToBook : 0) +
      (pickedIn ? Number(pickedIn.priceShared) * seatsToBook : 0);

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
            // Los asientos que corresponden a lo elegido, que son más que los
            // viajeros cuando hay que poner en marcha la salida
            passengers: seatsToBook,
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

              // Los asientos que pide esta salida: el grupo, o el mínimo si
              // hay que ponerla en marcha
              const seats = seatsFor(trip);
              const starting = needsOpening(trip);

              // Solo se bloquea por falta de lugar real en el vehículo
              const blocked =
                type === "SHARED"
                  ? trip.availableSeats < seats
                  : trip.bookedSeats > 0;

              const status = departureStatus(trip, seats);

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
                            color: status.color,
                          }}
                        >
                          {status.label}
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
                        color: starting
                          ? "var(--brand-green)"
                          : "var(--brand-gray)",
                        fontFamily: "DM Sans, sans-serif",
                        fontWeight: starting ? 600 : 400,
                      }}
                    >
                      {blocked
                        ? "Not available"
                        : starting
                          ? `${seats} seats · starts it`
                          : isSelected
                            ? "Selected"
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
      {type === "SHARED" ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
            fontFamily: "DM Sans, sans-serif",
            color: "var(--brand-gray)",
          }}
        >
          {/* Editable acá: al pedir 3 para arrancar una salida, este es el
              lugar donde ponerlo sin volver al buscador */}
          <label htmlFor="pax" style={{ fontSize: "0.9rem" }}>
            Travelling
          </label>
          <select
            id="pax"
            value={passengers}
            onChange={(e) => changePassengers(Number(e.target.value))}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #d9d3c7",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.9rem",
              background: "#fff",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} passenger{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <span style={{ fontSize: "0.9rem" }}>· Shared shuttle</span>
        </div>
      ) : (
        <p
          style={{
            color: "var(--brand-gray)",
            fontFamily: "DM Sans, sans-serif",
            marginBottom: "2rem",
          }}
        >
          Private transfer · full vehicle
        </p>
      )}

      {type === "SHARED" && (
        <div style={noticeStyle}>
          A departure starts running once 3 seats are booked. After that anyone
          can join it alone, and we never cancel a departure that is already
          running. Booking 3 seats starts one yourself.
        </div>
      )}

      {isPrivate && (
        <div style={noticeStyle}>
          Private transfers use an exclusive vehicle at the exact time you
          requested — no shared schedule, no minimum passengers.
        </div>
      )}

      {/* Ninguna salida en marcha todavía: en vez de dejar una lista apagada,
          se ponen las dos alternativas con su precio */}
      {!loading && type === "SHARED" && noneRunning && (
        <div style={compareStyle}>
          <strong style={{ display: "block", marginBottom: "0.35rem" }}>
            No departure is running on this date yet.
          </strong>
          You can start one by booking {sharedMin} seats
          {startPrice ? ` for $${startPrice}` : ""}, or take a private transfer
          at the time you choose
          {outboundRoute ? ` for $${Number(outboundRoute.pricePrivate)}` : ""}.{" "}
          <Link
            href={privateHref}
            style={{ color: "var(--brand-green)", fontWeight: 600 }}
          >
            See the private option →
          </Link>
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
              {/* Se cobran más asientos que viajeros: hay que decirlo acá,
                  que es donde el cliente mira el número antes de pagar */}
              {payingForMinimum && (
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--brand-gold)",
                    fontFamily: "DM Sans, sans-serif",
                    marginTop: "2px",
                  }}
                >
                  {seatsToBook} seats — the minimum that starts this departure
                </div>
              )}
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

/**
 * Estado de una salida compartida, en un solo lugar y por prioridad.
 *
 * El orden importa: primero lo que impide viajar y después lo que invita a
 * hacerlo. Cuando esto vivía repartido en la tarjeta, una salida sin un solo
 * asiento libre seguía diciendo "join in" al lado de un "0 / 10".
 */
function departureStatus(
  trip: Trip,
  seats: number,
): { label: string; color: string } {
  if (trip.availableSeats <= 0) {
    return { label: "Fully booked", color: "#a8443a" };
  }

  if (trip.availableSeats < seats) {
    const left = trip.availableSeats;
    return {
      label: `Only ${left} seat${left === 1 ? "" : "s"} left`,
      color: "#b06d1e",
    };
  }

  if (trip.sharedOpen) {
    return {
      label: `${trip.confirmedSeats} confirmed · join in`,
      color: "var(--brand-green)",
    };
  }

  return {
    label: `Not running yet · ${trip.sharedMinPassengers} seats start it`,
    color: "#b06d1e",
  };
}

/** Las dos salidas posibles cuando ninguna salida arrancó: abrir una, o privado */
const compareStyle: React.CSSProperties = {
  background: "#f2f7f4",
  border: "1px solid #cfe3d7",
  borderRadius: "10px",
  padding: "0.95rem 1.1rem",
  marginBottom: "1.75rem",
  color: "var(--brand-dark)",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.88rem",
  lineHeight: 1.65,
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
