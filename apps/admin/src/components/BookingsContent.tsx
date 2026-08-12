"use client";

import { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

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
  totalAmount: number;
  createdAt: string;
  notes?: string;
  flightNumber?: string;
  pickupAddress?: string;
  agreementSignedName?: string;
  agreementSignedAt?: string;
  user: { id: string; name: string; email: string; phone?: string };
  legs: Leg[];
  payment?: { externalId?: string; paidAt?: string; amount: number };
};

/** El tramo de ida representa la reserva cuando hay que mostrarla en una línea */
const outbound = (b: Booking) =>
  b.legs?.find((l) => l.direction === "OUTBOUND") ?? b.legs?.[0];

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

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "ALL" || b.status === filter;
    const matchSearch =
      search === "" ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      outbound(b)?.trip?.route?.origin?.toLowerCase().includes(search.toLowerCase()) ||
      outbound(b)?.trip?.route?.destination?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCancel = async (b: Booking) => {
    if (!confirm(`Cancel booking ${b.id.slice(0, 8).toUpperCase()}?`)) return;
    try {
      await apiFetch(`/bookings/${b.id}/cancel`, { method: "PATCH" });
      setBookings((prev) =>
        prev.map((x) => (x.id === b.id ? { ...x, status: "CANCELLED" } : x)),
      );
      if (selected?.id === b.id) setSelected({ ...b, status: "CANCELLED" });
    } catch {
      alert("Error cancelling booking");
    }
  };

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
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            placeholder="Search by ID, customer or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border-strong)",
              fontSize: "0.875rem",
              background: "var(--surface)",
              width: "260px",
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
                  borderColor:
                    filter === s ? "var(--brand-green)" : "var(--border-strong)",
                  background: filter === s ? "var(--brand-green)" : "var(--surface)",
                  color: filter === s ? "var(--surface)" : "var(--brand-gray)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "16px",
              padding: "2rem",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
                Booking Detail
              </h2>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--brand-gray)",
                  display: "inline-flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <Section title="Customer">
              <Row label="Name" value={selected.user?.name} />
              <Row label="Email" value={selected.user?.email} />
              <Row label="Phone" value={selected.user?.phone || "-"} />
            </Section>

            {/* Lo que necesita el conductor para el pickup */}
            {(selected.pickupAddress || selected.flightNumber || selected.notes) && (
              <Section title="Pickup details">
                {selected.pickupAddress && (
                  <Row label="Hotel / address" value={selected.pickupAddress} />
                )}
                {selected.flightNumber && (
                  <Row label="Flight number" value={selected.flightNumber} />
                )}
                {selected.notes && <Row label="Notes" value={selected.notes} />}
              </Section>
            )}

            {/* Un tramo por salida: en ida y vuelta el despacho necesita ver
                las dos, porque son dos vehiculos en dos dias distintos */}
            {selected.legs?.map((leg) => (
              <Section
                key={leg.direction}
                title={leg.direction === "RETURN" ? "Return leg" : "Outbound leg"}
              >
                <Row
                  label="Route"
                  value={`${leg.trip?.route?.origin} -> ${leg.trip?.route?.destination}`}
                />
                <Row
                  label="Departure"
                  value={new Date(leg.trip?.departureAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
                <Row label="Seats" value={String(leg.passengers)} />
                <Row label="Leg amount" value={`$${leg.amount}`} />
              </Section>
            ))}

            <Section title="Booking">
              <Row label="ID" value={selected.id.slice(0, 8).toUpperCase()} />
              <Row label="Type" value={selected.type} />
              <Row
                label="Trip type"
                value={
                  selected.tripType === "ROUND_TRIP" ? "Round trip" : "One way"
                }
              />
              <Row label="Passengers" value={String(selected.passengers)} />
              <Row label="Amount" value={`$${selected.totalAmount}`} green />
              <Row label="Status" value={selected.status} />
              <Row
                label="Created"
                value={new Date(selected.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
            </Section>

            {selected.agreementSignedName && (
              <Section title="Service agreement">
                <Row label="Signed by" value={selected.agreementSignedName} />
                <Row
                  label="Signed at"
                  value={
                    selected.agreementSignedAt
                      ? new Date(selected.agreementSignedAt).toLocaleString("en-US")
                      : "-"
                  }
                />
              </Section>
            )}

            {selected.payment && (
              <Section title="Payment">
                <Row label="Transaction" value={selected.payment.externalId || "-"} />
                <Row
                  label="Paid at"
                  value={
                    selected.payment.paidAt
                      ? new Date(selected.payment.paidAt).toLocaleString("en-US")
                      : "-"
                  }
                />
              </Section>
            )}

            {selected.status !== "CANCELLED" && (
              <button
                onClick={() => handleCancel(selected)}
                style={{
                  marginTop: "1rem",
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ffc5c5",
                  background: "#fff0f0",
                  color: "#c0392b",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          border: "1px solid var(--border-strong)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1.2fr 1fr 80px 80px 90px 100px 40px",
            padding: "0.875rem 1.5rem",
            borderBottom: "1px solid var(--border-soft)",
            fontSize: "0.75rem",
            color: "var(--brand-gray)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <span>Route</span>
          <span>Customer</span>
          <span>Departure</span>
          <span>Type</span>
          <span>Pax</span>
          <span>Amount</span>
          <span>Status</span>
          <span />
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
            const dep = new Date(outbound(b)?.trip?.departureAt);
            const s = statusStyle(b.status);
            return (
              <div
                key={b.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1.2fr 1fr 80px 80px 90px 100px 40px",
                  padding: "0.875rem 1.5rem",
                  alignItems: "center",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid var(--border-soft)" : "none",
                  fontSize: "0.875rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: "2px" }}>
                    {outbound(b)?.trip?.route?.origin} -&gt; {outbound(b)?.trip?.route?.destination}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}>
                    {b.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: "2px" }}>{b.user?.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}>
                    {b.user?.email}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: "2px" }}>
                    {dep.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}>
                    {dep.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--brand-gray)" }}>
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
                <button
                  onClick={() => setSelected(b)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--brand-gray)",
                    display: "inline-flex",
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--brand-gray)",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: "var(--surface-muted)",
          borderRadius: "10px",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
      <span style={{ color: "var(--brand-gray)" }}>{label}</span>
      <span style={{ fontWeight: 500, color: green ? "var(--brand-green)" : "var(--brand-dark)" }}>
        {value}
      </span>
    </div>
  );
}

const statusStyle = (s: string) =>
  ({
    CONFIRMED: { bg: "#f0faf5", color: "#1a6b4a" },
    PENDING: { bg: "#fff8e6", color: "#b07d00" },
    CANCELLED: { bg: "#fff0f0", color: "#c0392b" },
  })[s] || { bg: "#f5f5f5", color: "#666" };
