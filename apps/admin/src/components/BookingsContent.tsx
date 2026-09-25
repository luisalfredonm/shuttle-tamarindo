"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle, Phone, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { bookingPill, dayLabel, digits, money, outboundLeg, ref, time, titleCase } from "@/lib/format";
import PageHeader from "./ui/PageHeader";
import Sheet from "./ui/Sheet";
import ui from "./ui/ui.module.css";

const STATUS_FILTER = ["ALL", "CONFIRMED", "PENDING", "CANCELLED"];

type Leg = {
  direction: "OUTBOUND" | "RETURN";
  passengers: number;
  amount: number;
  trip: {
    departureAt: string;
    route: { origin: string; destination: string };
  };
};

type Booking = {
  id: string;
  status: string;
  type: string;
  tripType: "ONE_WAY" | "ROUND_TRIP";
  passengers: number;
  infants?: number;
  totalAmount: number;
  createdAt: string;
  notes?: string;
  flightNumber?: string;
  pickupAddress?: string;
  agreementSignedName?: string;
  agreementSignedAt?: string;
  user: { id: string; name: string; email: string; phone?: string };
  /** Reservada sin cuenta: el contacto es el de la compra, no el de un perfil */
  bookedAsGuest?: boolean;
  legs: Leg[];
  payment?: { externalId?: string; paidAt?: string; amount: number };
};

export default function BookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    apiFetch("/bookings/user/all")
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const q = search.toLowerCase();
  const matchesSearch = (b: Booking) =>
    q === "" ||
    b.id.toLowerCase().includes(q) ||
    b.user?.name?.toLowerCase().includes(q) ||
    b.user?.email?.toLowerCase().includes(q) ||
    outboundLeg(b)?.trip?.route?.origin?.toLowerCase().includes(q) ||
    outboundLeg(b)?.trip?.route?.destination?.toLowerCase().includes(q);

  const filtered = bookings.filter((b) => (filter === "ALL" || b.status === filter) && matchesSearch(b));
  const countFor = (s: string) => bookings.filter((b) => (s === "ALL" || b.status === s) && matchesSearch(b)).length;

  const handleCancel = async (b: Booking) => {
    if (!confirm(`Cancel booking ${ref(b.id)}?`)) return;
    try {
      await apiFetch(`/bookings/${b.id}/cancel`, { method: "PATCH" });
      setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: "CANCELLED" } : x)));
      if (selected?.id === b.id) setSelected({ ...b, status: "CANCELLED" });
    } catch {
      alert("Error cancelling booking");
    }
  };

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Every booking made on the website. Tap one to see pickup details and contact the customer."
        summary={
          !loading && (
            <>
              <span className={ui.chip}><span className={ui.chipDot} /> {bookings.filter((b) => b.status === "CONFIRMED").length} confirmed</span>
              <span className={ui.chip}>{bookings.filter((b) => b.status === "PENDING").length} pending payment</span>
            </>
          )
        }
      />

      <div className={ui.stack} style={{ marginBottom: "1rem" }}>
        <div className={ui.search}>
          <Search size={17} />
          <input
            type="search"
            className={ui.input}
            placeholder="Search by name, email, route or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search bookings"
          />
        </div>
        <div className={ui.segments} role="group" aria-label="Filter by status">
          {STATUS_FILTER.map((st) => (
            <button key={st} type="button" className={ui.segment} aria-pressed={filter === st} onClick={() => setFilter(st)}>
              {st === "ALL" ? "All" : titleCase(st)}
              {!loading && <span className={ui.count}>{countFor(st)}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className={ui.stack}>
          {[0, 1, 2].map((i) => <div key={i} className={ui.skeleton} style={{ height: 118 }} aria-hidden="true" />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className={ui.empty}>
          <h2>{bookings.length === 0 ? "No bookings yet" : "No bookings match"}</h2>
          <p>
            {bookings.length === 0
              ? "Bookings made on the website will show up here."
              : "Try another name or code, or switch the status filter to All."}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "0.75rem" }}>
          {filtered.map((b) => {
            const leg = outboundLeg(b);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelected(b)}
                className={ui.card}
                style={{ textAlign: "left", font: "inherit", color: "inherit", cursor: "pointer", padding: 0 }}
              >
                <div className={ui.cardPad} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div className={ui.cardHead} style={{ alignItems: "flex-start" }}>
                    <div className={ui.rowTitle} style={{ fontSize: "0.95rem" }}>
                      {leg?.trip?.route?.origin} → {leg?.trip?.route?.destination}
                    </div>
                    <span className={`${ui.pill} ${ui[bookingPill(b.status)]}`}>{titleCase(b.status)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "0.75rem" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", overflowWrap: "anywhere" }}>{b.user?.name}</div>
                      <div className={ui.rowMeta}>
                        {leg?.trip?.departureAt ? `${dayLabel(leg.trip.departureAt)} · ${time(leg.trip.departureAt)}` : "—"}
                      </div>
                      <div className={ui.rowMeta}>
                        <span className={ui.mono}>{ref(b.id)}</span> · {b.passengers} pax · {titleCase(b.type)}
                        {b.tripType === "ROUND_TRIP" && " · round trip"}
                      </div>
                    </div>
                    <div className={ui.money} style={{ fontSize: "1.1rem" }}>{money(b.totalAmount)}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && <BookingSheet booking={selected} onClose={() => setSelected(null)} onCancel={() => handleCancel(selected)} />}
    </div>
  );
}

function BookingSheet({ booking: b, onClose, onCancel }: { booking: Booking; onClose: () => void; onCancel: () => void }) {
  const phone = b.user?.phone ? digits(b.user.phone) : "";

  return (
    <Sheet
      title={`Booking ${ref(b.id)}`}
      subtitle={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className={`${ui.pill} ${ui[bookingPill(b.status)]}`}>{titleCase(b.status)}</span>
          <span>{titleCase(b.type)} · {b.tripType === "ROUND_TRIP" ? "Round trip" : "One way"}</span>
        </span>
      }
      onClose={onClose}
    >
      <div className={ui.stack}>
        {/* Contacto a un toque: es lo que se usa en la calle */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
          <a href={phone ? `tel:${phone}` : undefined} aria-disabled={!phone} className={`${ui.btn} ${ui.secondary}`} style={!phone ? { opacity: 0.45, pointerEvents: "none" } : undefined}>
            <Phone size={16} /> Call
          </a>
          <a href={phone ? `https://wa.me/${phone}` : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!phone} className={`${ui.btn} ${ui.green}`} style={!phone ? { opacity: 0.45, pointerEvents: "none" } : undefined}>
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a href={`mailto:${b.user?.email}`} className={`${ui.btn} ${ui.secondary}`}>
            <Mail size={16} /> Email
          </a>
        </div>

        <DetailCard title="Customer">
          <Fact label="Name" value={b.user?.name} />
          <Fact label="Email" value={b.user?.email} />
          <Fact label="Phone" value={b.user?.phone || "—"} />
          <Fact label="Booked" value={b.bookedAsGuest ? "As guest (no account)" : "With an account"} />
        </DetailCard>

        {/* Lo que necesita el conductor para el pickup */}
        {(b.pickupAddress || b.flightNumber || b.notes) && (
          <DetailCard title="Pickup details">
            {b.pickupAddress && <Fact label="Hotel / address" value={b.pickupAddress} />}
            {b.flightNumber && <Fact label="Flight" value={b.flightNumber} />}
            {b.notes && <Fact label="Notes" value={b.notes} />}
          </DetailCard>
        )}

        {/* Un tramo por salida: en ida y vuelta son dos vehículos en dos días */}
        {b.legs?.map((leg) => (
          <DetailCard key={leg.direction} title={leg.direction === "RETURN" ? "Return" : "Outbound"}>
            <Fact label="Route" value={`${leg.trip?.route?.origin} → ${leg.trip?.route?.destination}`} />
            <Fact label="Departure" value={`${dayLabel(leg.trip?.departureAt)} · ${time(leg.trip?.departureAt)}`} />
            <Fact label="Seats" value={String(leg.passengers)} />
            <Fact label="Leg amount" value={money(leg.amount)} />
          </DetailCard>
        ))}

        <DetailCard title="Booking">
          <Fact label="Passengers" value={String(b.passengers)} />
          {!!b.infants && <Fact label="Infants (0–2)" value={String(b.infants)} />}
          <Fact label="Total" value={<span className={ui.money}>{money(b.totalAmount)}</span>} />
          <Fact label="Created" value={new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
        </DetailCard>

        {b.agreementSignedName && (
          <DetailCard title="Service agreement">
            <Fact label="Signed by" value={b.agreementSignedName} />
            <Fact label="Signed at" value={b.agreementSignedAt ? new Date(b.agreementSignedAt).toLocaleString("en-US") : "—"} />
          </DetailCard>
        )}

        {b.payment && (
          <DetailCard title="Payment">
            <Fact label="Transaction" value={<span className={ui.mono}>{b.payment.externalId || "—"}</span>} />
            <Fact label="Paid at" value={b.payment.paidAt ? new Date(b.payment.paidAt).toLocaleString("en-US") : "—"} />
          </DetailCard>
        )}
      </div>

      {b.status !== "CANCELLED" && (
        <div className={ui.sheetActions}>
          <button type="button" onClick={onCancel} className={`${ui.btn} ${ui.danger}`}>
            Cancel booking
          </button>
        </div>
      )}
    </Sheet>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className={ui.eyebrow} style={{ marginBottom: 6 }}>{title}</div>
      <dl className={`${ui.facts} ${ui.card} ${ui.cardPad}`} style={{ boxShadow: "none", background: "var(--surface-2)" }}>
        {children}
      </dl>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={ui.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
