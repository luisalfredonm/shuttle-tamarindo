"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { money } from "@/lib/format";
import Sheet from "../ui/Sheet";
import Stepper from "../ui/Stepper";
import ui from "../ui/ui.module.css";

type Route = {
  slug: string;
  origin: string;
  destination: string;
  pricePrivate: number | string;
  pricePrivateRoundTrip: number | string | null;
};

type Trip = {
  id: string;
  departureAt: string;
  priceShared: number | string;
  availableSeats: number;
  confirmedSeats: number;
  sharedMinPassengers: number;
  sharedOpen: boolean;
  status: string;
};

type Pricing = { includedPassengers: number; extraPassengerPrice: number | string; vehicleCapacity: number };

type PayMethod = "CASH" | "CARD" | "SINPE";

const PAY_METHODS: { value: PayMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "SINPE", label: "SINPE" },
];

/** Costa Rica es UTC-6 fijo, sin horario de verano */
const CR_OFFSET_MS = 6 * 60 * 60 * 1000;

/** Fecha "YYYY-MM-DD" en hora de Costa Rica, sin importar dónde corre el navegador */
const crDate = (d: string | Date) => new Date(new Date(d).getTime() - CR_OFFSET_MS).toISOString().slice(0, 10);

const crTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Costa_Rica" });

/** Instante ISO de una fecha y hora tipeadas en hora de Costa Rica */
const crInstant = (date: string, time: string) => `${date}T${time}:00-06:00`;

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

/**
 * Reserva cargada a mano (cliente de WhatsApp o teléfono). Usa las mismas
 * reglas de la web: el API valida asientos y calcula el precio; acá solo se
 * muestra una estimación para que el admin sepa cuánto cobrar.
 */
export default function NewBookingSheet({ onClose, onCreated }: Props) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);

  const [type, setType] = useState<"PRIVATE" | "SHARED">("PRIVATE");
  const [roundTrip, setRoundTrip] = useState(false);
  const [routeSlug, setRouteSlug] = useState("");

  const today = crDate(new Date());
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [tripId, setTripId] = useState("");
  const [returnDate, setReturnDate] = useState(today);
  const [returnTime, setReturnTime] = useState("");
  const [returnTripId, setReturnTripId] = useState("");

  const [passengers, setPassengers] = useState("2");
  const [infants, setInfants] = useState("0");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [method, setMethod] = useState<PayMethod>("CASH");
  const [customTotal, setCustomTotal] = useState("");

  const [outTrips, setOutTrips] = useState<Trip[]>([]);
  const [backTrips, setBackTrips] = useState<Trip[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/routes?active=true")
      .then((data) => setRoutes(Array.isArray(data) ? data : []))
      .catch(() => setRoutes([]));
    apiFetch("/pricing").then(setPricing).catch(() => setPricing(null));
  }, []);

  const route = routes.find((r) => r.slug === routeSlug);
  // El regreso es la ruta inversa: sin ella no hay ida y vuelta posible
  const reverse = route && routes.find((r) => r.origin === route.destination && r.destination === route.origin);

  // Salidas compartidas ya generadas, de la ruta y de su inversa
  useEffect(() => {
    if (type !== "SHARED" || !route) return;
    apiFetch(`/trips?routeSlug=${encodeURIComponent(route.slug)}`)
      .then((data) => setOutTrips(Array.isArray(data) ? data : []))
      .catch(() => setOutTrips([]));
  }, [type, route]);

  useEffect(() => {
    if (type !== "SHARED" || !roundTrip || !reverse) return;
    apiFetch(`/trips?routeSlug=${encodeURIComponent(reverse.slug)}`)
      .then((data) => setBackTrips(Array.isArray(data) ? data : []))
      .catch(() => setBackTrips([]));
  }, [type, roundTrip, reverse]);

  const pax = Number(passengers) || 0;
  const babies = type === "PRIVATE" ? Number(infants) || 0 : 0;
  const capacity = pricing?.vehicleCapacity ?? 10;

  const outOptions = outTrips.filter((t) => t.status === "SCHEDULED" && crDate(t.departureAt) === date);
  const backOptions = backTrips.filter((t) => t.status === "SCHEDULED" && crDate(t.departureAt) === returnDate);
  const outTrip = outOptions.find((t) => t.id === tripId);
  const backTrip = backOptions.find((t) => t.id === returnTripId);

  // Misma cuenta que el API; null = la ruta no tiene precio para esa combinación
  const systemTotal = useMemo(() => {
    if (!route) return null;
    if (type === "SHARED") {
      if (!outTrip || (roundTrip && !backTrip)) return null;
      return Number(outTrip.priceShared) * pax + (roundTrip && backTrip ? Number(backTrip.priceShared) * pax : 0);
    }
    const base = roundTrip ? route.pricePrivateRoundTrip : route.pricePrivate;
    if (base === null || !pricing) return null;
    const extra = Math.max(0, pax - pricing.includedPassengers) * Number(pricing.extraPassengerPrice);
    return Number(base) + extra;
  }, [route, type, roundTrip, outTrip, backTrip, pax, pricing]);

  const total = customTotal !== "" ? Number(customTotal) : systemTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!route) return setError("Choose a route.");
    if (roundTrip && !reverse) return setError(`There is no route back from ${route.destination}.`);
    if (type === "SHARED" && !outTrip) return setError("Choose the departure.");
    if (type === "SHARED" && roundTrip && !backTrip) return setError("Choose the return departure.");
    if (type === "PRIVATE" && !time) return setError("Set the pickup time.");
    if (type === "PRIVATE" && roundTrip && !returnTime) return setError("Set the return pickup time.");
    if (total === null || !Number.isFinite(total)) return setError("This route has no price for that option. Type the agreed total.");

    const body = {
      type,
      passengers: pax,
      ...(type === "PRIVATE"
        ? {
            infants: babies,
            routeSlug: route.slug,
            departureAt: crInstant(date, time),
            ...(roundTrip && reverse
              ? { returnRouteSlug: reverse.slug, returnDepartureAt: crInstant(returnDate, returnTime) }
              : {}),
          }
        : { tripId, ...(roundTrip ? { returnTripId } : {}) }),
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      pickupAddress: pickupAddress || undefined,
      flightNumber: flightNumber || undefined,
      notes: notes || undefined,
      paymentMethod: method,
      // Solo se manda si el admin pactó otro precio
      ...(customTotal !== "" ? { totalAmount: Number(customTotal) } : {}),
    };

    setSaving(true);
    try {
      await apiFetch("/bookings/manual", { method: "POST", body: JSON.stringify(body) });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the booking");
    } finally {
      setSaving(false);
    }
  };

  const two = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" } as const;

  return (
    <Sheet title="New booking" subtitle="For customers who book by WhatsApp or phone. They pay on the day of the transfer." onClose={onClose}>
      <form onSubmit={handleSubmit} className={ui.form}>
        <fieldset className={ui.group}>
          <legend>Service</legend>
          <div className={ui.segments} role="group" aria-label="Service type">
            {(["PRIVATE", "SHARED"] as const).map((t) => (
              <button key={t} type="button" className={ui.segment} aria-pressed={type === t} onClick={() => { setType(t); setTripId(""); setReturnTripId(""); }}>
                {t === "PRIVATE" ? "Private" : "Shared"}
              </button>
            ))}
            {[false, true].map((rt) => (
              <button key={String(rt)} type="button" className={ui.segment} aria-pressed={roundTrip === rt} onClick={() => setRoundTrip(rt)}>
                {rt ? "Round trip" : "One way"}
              </button>
            ))}
          </div>

          <div className={ui.field}>
            <label className={ui.label} htmlFor="nb-route">Route</label>
            <select id="nb-route" className={ui.select} required value={routeSlug} onChange={(e) => { setRouteSlug(e.target.value); setTripId(""); setReturnTripId(""); }}>
              <option value="">Choose a route</option>
              {routes.map((r) => (
                <option key={r.slug} value={r.slug}>{r.origin} → {r.destination}</option>
              ))}
            </select>
            {roundTrip && route && !reverse && (
              <p className={ui.hint} style={{ color: "#c0392b" }}>There is no route from {route.destination} back to {route.origin}.</p>
            )}
          </div>
        </fieldset>

        <LegFields
          title={roundTrip ? "Outbound" : "Departure"}
          idPrefix="nb-out"
          type={type}
          date={date}
          onDate={(v) => { setDate(v); setTripId(""); }}
          time={time}
          onTime={setTime}
          options={route ? outOptions : null}
          selectedId={tripId}
          onSelect={setTripId}
          pax={pax}
          min={today}
        />

        {roundTrip && reverse && (
          <LegFields
            title={`Return · ${reverse.origin} → ${reverse.destination}`}
            idPrefix="nb-back"
            type={type}
            date={returnDate}
            onDate={(v) => { setReturnDate(v); setReturnTripId(""); }}
            time={returnTime}
            onTime={setReturnTime}
            options={backOptions}
            selectedId={returnTripId}
            onSelect={setReturnTripId}
            pax={pax}
            min={date}
          />
        )}

        <fieldset className={ui.group}>
          <legend>Passengers</legend>
          <div style={type === "PRIVATE" ? two : undefined}>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="nb-pax">Adults and children</label>
              <Stepper id="nb-pax" label="passengers" value={passengers} onChange={setPassengers} min={1} max={Math.max(1, capacity - babies)} />
            </div>
            {type === "PRIVATE" && (
              <div className={ui.field}>
                <label className={ui.label} htmlFor="nb-infants">Infants 0–2</label>
                <Stepper id="nb-infants" label="infants" value={infants} onChange={setInfants} min={0} max={Math.max(0, capacity - pax)} />
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className={ui.group}>
          <legend>Customer</legend>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="nb-name">Name</label>
            <input id="nb-name" className={ui.input} required autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="nb-phone">Phone / WhatsApp</label>
            <input id="nb-phone" className={ui.input} required type="tel" inputMode="tel" placeholder="+1 555 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="nb-email">Email</label>
            <input id="nb-email" className={ui.input} required type="email" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className={ui.hint}>The confirmation with the booking link goes here.</p>
          </div>
        </fieldset>

        <fieldset className={ui.group}>
          <legend>Pickup</legend>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="nb-pickup">Hotel or address <span className={ui.optional}>(optional)</span></label>
            <input id="nb-pickup" className={ui.input} value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
          </div>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="nb-flight">Flight <span className={ui.optional}>(optional)</span></label>
            <input id="nb-flight" className={ui.input} autoCapitalize="characters" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
          </div>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="nb-notes">Notes <span className={ui.optional}>(optional)</span></label>
            <input id="nb-notes" className={ui.input} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </fieldset>

        <fieldset className={ui.group}>
          <legend>Payment on site</legend>
          <div className={ui.segments} role="group" aria-label="Payment method">
            {PAY_METHODS.map((m) => (
              <button key={m.value} type="button" className={ui.segment} aria-pressed={method === m.value} onClick={() => setMethod(m.value)}>
                {m.label}
              </button>
            ))}
          </div>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="nb-total">Total to collect</label>
            <div className={ui.affix}>
              <span>$</span>
              <input
                id="nb-total"
                inputMode="decimal"
                placeholder={systemTotal !== null ? String(systemTotal) : "Agreed price"}
                value={customTotal}
                onChange={(e) => setCustomTotal(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <p className={ui.hint}>
              {systemTotal !== null
                ? `Regular price: ${money(systemTotal)}. Leave it empty to charge that, or type a special price.`
                : "Pick the route and departure to see the regular price."}
            </p>
          </div>
        </fieldset>

        {error && <div className={`${ui.notice} ${ui.noticeError}`} role="alert">{error}</div>}

        <div className={ui.sheetActions}>
          <button type="button" onClick={onClose} className={`${ui.btn} ${ui.secondary}`}>Cancel</button>
          <button type="submit" disabled={saving} className={`${ui.btn} ${ui.primary}`}>
            {saving ? "Saving..." : total !== null && Number.isFinite(total) ? `Confirm · ${money(total)}` : "Confirm booking"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

type LegProps = {
  title: string;
  idPrefix: string;
  type: "PRIVATE" | "SHARED";
  date: string;
  onDate: (v: string) => void;
  time: string;
  onTime: (v: string) => void;
  /** null = todavía no hay ruta elegida */
  options: Trip[] | null;
  selectedId: string;
  onSelect: (id: string) => void;
  pax: number;
  min: string;
};

/** Fecha y hora de un tramo: hora libre en privado, salida existente en compartido */
function LegFields({ title, idPrefix, type, date, onDate, time, onTime, options, selectedId, onSelect, pax, min }: LegProps) {
  const selected = options?.find((t) => t.id === selectedId);

  return (
    <fieldset className={ui.group}>
      <legend>{title}</legend>
      <div style={type === "PRIVATE" ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" } : undefined}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor={`${idPrefix}-date`}>Date</label>
          <input id={`${idPrefix}-date`} type="date" className={ui.input} required min={min} value={date} onChange={(e) => onDate(e.target.value)} />
        </div>
        {type === "PRIVATE" && (
          <div className={ui.field}>
            <label className={ui.label} htmlFor={`${idPrefix}-time`}>Pickup time</label>
            <input id={`${idPrefix}-time`} type="time" className={ui.input} required value={time} onChange={(e) => onTime(e.target.value)} />
          </div>
        )}
      </div>

      {type === "SHARED" && options && (
        <div className={ui.field}>
          <span className={ui.label}>Departure</span>
          {options.length === 0 ? (
            <p className={ui.hint} style={{ marginTop: 0 }}>No shared departures on this date.</p>
          ) : (
            <div className={ui.segments} role="group" aria-label={`${title} departure`}>
              {options.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={ui.segment}
                  aria-pressed={selectedId === t.id}
                  disabled={t.availableSeats < pax}
                  onClick={() => onSelect(t.id)}
                >
                  {crTime(t.departureAt)} · {t.availableSeats} left
                </button>
              ))}
            </div>
          )}
          {/* El admin puede abrir una salida sin el mínimo: decide él si corre */}
          {selected && !selected.sharedOpen && (
            <p className={ui.hint}>
              {selected.confirmedSeats} confirmed so far, below the minimum of {selected.sharedMinPassengers}. You decide if it runs.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
