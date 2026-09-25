"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PenLine, Plus, Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { dayLabel, money, occupancyColor, ref, shortDate, time, titleCase, tripPill } from "@/lib/format";
import PageHeader from "./ui/PageHeader";
import Sheet from "./ui/Sheet";
import ui from "./ui/ui.module.css";
import s from "./trips/trips.module.css";

type Route = { id: string; origin: string; destination: string };
type Trip = {
  id: string;
  departureAt: string;
  capacity: number;
  bookedSeats: number;
  priceShared: number;
  status: string;
  route: Route;
};

const emptyForm = { routeId: "", departureAt: "", capacity: "10", priceShared: "" };
const STATUSES = ["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default function TripsContent() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRoute, setFilterRoute] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [viewing, setViewing] = useState<Trip | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTrips = (routeId = filterRoute, date = filterDate) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (routeId) params.set("routeId", routeId);
    if (date) params.set("date", date);
    apiFetch(`/trips?${params}`)
      .then((data) => setTrips(Array.isArray(data) ? data : []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiFetch("/routes").then((data) => setRoutes(Array.isArray(data) ? data : []));
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Los filtros se aplican al elegirlos: en el teléfono un botón "Filter" aparte es un toque de más
  const changeRoute = (v: string) => { setFilterRoute(v); loadTrips(v, filterDate); };
  const changeDate = (v: string) => { setFilterDate(v); loadTrips(filterRoute, v); };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (t: Trip) => {
    setViewing(null);
    setEditing(t);
    const local = new Date(t.departureAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    const localStr = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
    setForm({ routeId: t.route.id, departureAt: localStr, capacity: String(t.capacity), priceShared: String(t.priceShared) });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { ...form, capacity: Number(form.capacity), priceShared: Number(form.priceShared) };
      if (editing) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- la ruta de un viaje no se cambia
        const { routeId, ...updateBody } = body;
        const updated = await apiFetch(`/trips/${editing.id}`, { method: "PATCH", body: JSON.stringify(updateBody) });
        setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        await apiFetch("/trips", { method: "POST", body: JSON.stringify(body) });
        loadTrips();
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Trip) => {
    if (!confirm(`¿Eliminar el viaje ${t.route.origin} → ${t.route.destination}?`)) return;
    try {
      await apiFetch(`/trips/${t.id}`, { method: "DELETE" });
      setTrips((prev) => prev.filter((x) => x.id !== t.id));
      setViewing(null);
    } catch {
      alert("Error al eliminar el viaje");
    }
  };

  const handleStatusChange = async (t: Trip, status: string) => {
    try {
      const updated = await apiFetch(`/trips/${t.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setTrips((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setViewing((v) => (v?.id === updated.id ? updated : v));
    } catch {
      alert("Error al actualizar el estado");
    }
  };

  // Agenda: una sección por día, en el orden en que salen
  const days: { key: string; date: string; trips: Trip[] }[] = [];
  for (const t of [...trips].sort((a, b) => +new Date(a.departureAt) - +new Date(b.departureAt))) {
    const key = new Date(t.departureAt).toDateString();
    const last = days[days.length - 1];
    if (last?.key === key) last.trips.push(t);
    else days.push({ key, date: t.departureAt, trips: [t] });
  }
  const seatsSold = trips.reduce((sum, t) => sum + t.bookedSeats, 0);

  return (
    <div>
      <PageHeader
        title="Trips"
        subtitle={
          <>
            Shared departures by day. They are created automatically from{" "}
            <Link href="/schedules" style={{ color: "var(--brand-green)", fontWeight: 600 }}>Schedules</Link>; add one here only for a special date.
          </>
        }
        summary={
          !loading && trips.length > 0 && (
            <>
              <span className={ui.chip}><span className={ui.chipDot} /> {trips.length} departures</span>
              <span className={ui.chip}>{seatsSold} seats booked</span>
            </>
          )
        }
        actions={
          <button type="button" onClick={openCreate} className={`${ui.btn} ${ui.primary}`}>
            <Plus size={16} strokeWidth={2.5} /> New trip
          </button>
        }
      />

      <div className={s.filters}>
        <select className={ui.select} value={filterRoute} onChange={(e) => changeRoute(e.target.value)} aria-label="Filter by route">
          <option value="">All routes</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
        </select>
        <div className={s.filterRow}>
          <input type="date" className={ui.input} value={filterDate} onChange={(e) => changeDate(e.target.value)} aria-label="Filter by date" />
          {filterDate && (
            <button type="button" className={`${ui.iconBtn}`} onClick={() => changeDate("")} aria-label="Clear date">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className={ui.stack}>
          {[0, 1].map((i) => <div key={i} className={ui.skeleton} style={{ height: 200 }} aria-hidden="true" />)}
        </div>
      )}

      {!loading && trips.length === 0 && (
        <div className={ui.empty}>
          <h2>No departures found</h2>
          <p>{filterRoute || filterDate ? "Nothing matches these filters. Clear them to see every departure." : "Add a departure time in Schedules and the departures appear here."}</p>
        </div>
      )}

      {!loading &&
        days.map((day) => {
          const label = dayLabel(day.date);
          const today = label === "Today";
          return (
            <section key={day.key} className={s.day} aria-label={shortDate(day.date)}>
              <div className={s.dayHead}>
                <span className={`${s.dayName} ${today ? s.dayToday : ""}`}>
                  {label === "Today" || label === "Tomorrow" ? `${label} · ${shortDate(day.date)}` : label}
                </span>
                <span className={s.dayCount}>
                  {day.trips.length} {day.trips.length === 1 ? "departure" : "departures"}
                </span>
              </div>
              <div className={`${ui.card} ${s.list}`}>
                {day.trips.map((t) => {
                  const pct = t.capacity ? Math.round((t.bookedSeats / t.capacity) * 100) : 0;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`${s.trip} ${t.status === "CANCELLED" ? s.tripCancelled : ""}`}
                      onClick={() => setViewing(t)}
                    >
                      <span className={s.tripTime}>{time(t.departureAt)}</span>
                      <span style={{ minWidth: 0 }}>
                        <span className={s.tripRoute}>{t.route?.origin} → {t.route?.destination}</span>
                        <span className={s.tripMeta}>
                          <span className={`${ui.pill} ${ui[tripPill(t.status)]}`}>{titleCase(t.status)}</span>
                          {money(t.priceShared)}/seat
                        </span>
                      </span>
                      <span className={s.seats}>
                        <span className={s.seatsNum}>{t.bookedSeats}<small>/{t.capacity}</small></span>
                        <span className={s.bar} style={{ display: "block" }}>
                          <span style={{ width: `${pct}%`, background: occupancyColor(pct) }} />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

      {viewing && (
        <Sheet
          title={`${viewing.route.origin} → ${viewing.route.destination}`}
          subtitle={`${dayLabel(viewing.departureAt)} · ${time(viewing.departureAt)} · ${ref(viewing.id)}`}
          onClose={() => setViewing(null)}
        >
          <div className={ui.stack}>
            <dl className={`${ui.facts} ${ui.card} ${ui.cardPad}`} style={{ boxShadow: "none", background: "var(--surface-2)" }}>
              <div className={ui.fact}><dt>Seats booked</dt><dd>{viewing.bookedSeats} of {viewing.capacity}</dd></div>
              <div className={ui.fact}><dt>Seats left</dt><dd>{viewing.capacity - viewing.bookedSeats}</dd></div>
              <div className={ui.fact}><dt>Price per seat</dt><dd className={ui.money}>{money(viewing.priceShared)}</dd></div>
            </dl>

            <div>
              <div className={ui.eyebrow} style={{ marginBottom: 8 }}>Status</div>
              <div className={s.statusGrid} role="group" aria-label="Trip status">
                {STATUSES.map((st) => (
                  <button key={st} type="button" className={s.statusBtn} aria-pressed={viewing.status === st} onClick={() => viewing.status !== st && handleStatusChange(viewing, st)}>
                    {titleCase(st)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={ui.sheetActions}>
            <button type="button" onClick={() => handleDelete(viewing)} className={`${ui.btn} ${ui.danger}`}>
              <Trash2 size={16} /> Delete
            </button>
            <button type="button" onClick={() => openEdit(viewing)} className={`${ui.btn} ${ui.secondary}`}>
              <PenLine size={16} /> Edit
            </button>
          </div>
        </Sheet>
      )}

      {showForm && (
        <Sheet
          title={editing ? "Edit trip" : "New trip"}
          subtitle={editing ? `${editing.route.origin} → ${editing.route.destination}` : "A one-off departure outside the regular schedule."}
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className={ui.form}>
            {!editing && (
              <div className={ui.field}>
                <label className={ui.label} htmlFor="trip-route">Route</label>
                <select id="trip-route" required className={ui.select} value={form.routeId} onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value }))}>
                  <option value="">Select a route...</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
                </select>
              </div>
            )}
            <div className={ui.field}>
              <label className={ui.label} htmlFor="trip-departure">Departure</label>
              <input id="trip-departure" required type="datetime-local" className={ui.input} value={form.departureAt} onChange={(e) => setForm((f) => ({ ...f, departureAt: e.target.value }))} />
            </div>
            <div className={ui.fields2}>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="trip-capacity">Seats</label>
                <input id="trip-capacity" required inputMode="numeric" className={ui.input} placeholder="10" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="trip-price">Price per seat</label>
                <div className={ui.affix}>
                  <span>$</span>
                  <input id="trip-price" required inputMode="decimal" placeholder="30" value={form.priceShared} onChange={(e) => setForm((f) => ({ ...f, priceShared: e.target.value }))} />
                </div>
              </div>
            </div>
            {error && <div className={`${ui.notice} ${ui.noticeError}`} style={{ marginBottom: 0 }}>{error}</div>}
            <div className={ui.sheetActions}>
              <button type="button" onClick={() => setShowForm(false)} className={`${ui.btn} ${ui.secondary}`}>Cancel</button>
              <button type="submit" disabled={saving} className={`${ui.btn} ${ui.primary}`}>
                {saving ? "Saving..." : editing ? "Save changes" : "Create trip"}
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  );
}
