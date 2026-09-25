"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { money } from "@/lib/format";
import PageHeader from "./ui/PageHeader";
import Sheet from "./ui/Sheet";
import Switch from "./ui/Switch";
import Toast from "./ui/Toast";
import ui from "./ui/ui.module.css";
import s from "./schedules/schedules.module.css";

type Schedule = {
  id: string;
  routeId: string;
  departureTime: string;
  priceShared: string | number;
  capacity: number;
  isActive: boolean;
  /** 0 = domingo ... 6 = sábado, hora de Costa Rica */
  daysOfWeek: number[];
};

type Coverage = {
  routeId: string;
  slug: string;
  origin: string;
  destination: string;
  schedules: Schedule[];
  upcomingTrips: number;
  generatedUntil: string | null;
  sharedEnabled: boolean;
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
// Lunes primero, que es como se lee la semana en Costa Rica
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Every day", "Saturdays only", "Mo, We, Fr" */
function daysLabel(days: number[]) {
  if (days.length === 7) return "Every day";
  if (days.length === 1) return `${DAY_LONG[days[0]]}s only`;
  return WEEK.filter((d) => days.includes(d)).map((d) => DAY_SHORT[d]).join(", ");
}

const emptyDraft = { departureTime: "", priceShared: "", capacity: "10", daysOfWeek: ALL_DAYS };

export default function SchedulesContent() {
  const [routes, setRoutes] = useState<Coverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  // Ruta a la que se le está agregando un horario (la hoja de alta)
  const [adding, setAdding] = useState<Coverage | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const clearNotice = useCallback(() => setNotice(""), []);
  const clearError = useCallback(() => setError(""), []);

  const load = () =>
    apiFetch("/schedules/coverage")
      .then((data) => setRoutes(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Could not load schedules"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openAdd = (route: Coverage) => {
    setDraft(emptyDraft);
    setError("");
    setAdding(route);
  };

  const addSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adding) return;
    if (!draft.departureTime || !draft.priceShared) {
      setError("Enter the departure time and the price");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiFetch(`/routes/${adding.routeId}/schedules`, {
        method: "POST",
        body: JSON.stringify({
          departureTime: draft.departureTime,
          priceShared: Number(draft.priceShared),
          capacity: Number(draft.capacity),
          daysOfWeek: draft.daysOfWeek,
        }),
      });
      // Las salidas de ese horario todavía no existen: se generan en el acto
      // para que el horario nuevo se pueda vender sin esperar al job nocturno
      const result = await apiFetch("/schedules/generate", {
        method: "POST",
        body: JSON.stringify({ routeId: adding.routeId }),
      });
      setNotice(`Departure time added. ${result.created} departures are ready to sell.`);
      setAdding(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the schedule");
    } finally {
      setSaving(false);
    }
  };

  const toggleSchedule = async (schedule: Schedule) => {
    setError("");
    try {
      await apiFetch(`/schedules/${schedule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !schedule.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the schedule");
    }
  };

  const changeDays = async (schedule: Schedule, days: number[]) => {
    if (days.length === 0) {
      setError("A schedule needs at least one day. Pause it instead to stop selling it.");
      return;
    }
    setError("");
    setNotice("");
    try {
      const result = await apiFetch(`/schedules/${schedule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ daysOfWeek: days }),
      });
      setNotice(
        `${schedule.departureTime} now runs: ${daysLabel(result.daysOfWeek)}.` +
          (result.movedTrips ? ` ${result.movedTrips} empty departures on other days were removed.` : "") +
          " Departures that already have passengers are kept.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the days");
    }
  };

  const removeSchedule = async (route: Coverage, schedule: Schedule) => {
    const ok = confirm(
      `Remove the ${schedule.departureTime} departure on ${route.origin} → ${route.destination}?\n\n` +
        `Future departures with no bookings are deleted. Departures that already have passengers are kept.`,
    );
    if (!ok) return;

    setError("");
    setNotice("");
    try {
      const result = await apiFetch(`/schedules/${schedule.id}`, { method: "DELETE" });
      setNotice(`Schedule removed. ${result.deletedTrips} future departures with no bookings were deleted.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the schedule");
    }
  };

  const generateAll = async () => {
    setGenerating(true);
    setError("");
    setNotice("");
    try {
      const result = await apiFetch("/schedules/generate", { method: "POST", body: JSON.stringify({}) });
      setNotice(
        result.created === 0
          ? `All caught up: departures already cover the next ${result.windowDays} days.`
          : `${result.created} departures generated for the next ${result.windowDays} days.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate departures");
    } finally {
      setGenerating(false);
    }
  };

  const shared = routes.filter((r) => r.schedules.length > 0);
  const privateOnly = routes.filter((r) => r.schedules.length === 0);

  return (
    <div>
      <PageHeader
        title="Schedules"
        subtitle="Set a departure time and the days it runs. The system creates those departures for the next 60 days."
        actions={
          <button type="button" onClick={generateAll} disabled={generating} className={`${ui.btn} ${ui.secondary}`}>
            <RefreshCw size={15} className={generating ? "spin" : undefined} />
            {generating ? "Generating..." : "Generate departures"}
          </button>
        }
      />

      {notice && <Toast message={notice} onClose={clearNotice} />}
      {error && !adding && <Toast message={error} tone="error" onClose={clearError} />}

      {loading && <div className={ui.skeleton} style={{ height: 280 }} aria-hidden="true" />}

      {!loading &&
        shared.map((route) => (
          <section key={route.routeId} className={`${ui.card} ${s.routeCard}`}>
            <div className={s.routeHead}>
              <div style={{ minWidth: 0 }}>
                <div className={s.routeName}>
                  {route.origin} <span className={s.arrow} aria-hidden="true">→</span> {route.destination}
                </div>
                <CoverageLine route={route} />
              </div>
            </div>

            {route.schedules.map((sc) => (
              <div key={sc.id} className={`${s.slot} ${sc.isActive ? "" : s.slotPaused}`}>
                <div className={s.slotInfo}>
                  <div className={s.slotTime}>{sc.departureTime}</div>
                  <div className={s.slotMeta}>
                    {money(sc.priceShared)} per seat · {sc.capacity} seats
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSchedule(route, sc)}
                  className={`${ui.iconBtn} ${ui.iconDanger} ${s.slotRemove}`}
                  aria-label={`Remove the ${sc.departureTime} departure`}
                >
                  <Trash2 size={17} />
                </button>
                <div className={s.slotDays}>
                  <DayPicker days={sc.daysOfWeek} onChange={(days) => changeDays(sc, days)} />
                </div>
                <div className={s.slotSwitch}>
                  <span className={s.daysLabel}>{daysLabel(sc.daysOfWeek)}</span>
                  <Switch checked={sc.isActive} onChange={() => toggleSchedule(sc)} label={sc.isActive ? "Selling" : "Paused"} />
                </div>
              </div>
            ))}

            <div className={s.addBar}>
              <button type="button" onClick={() => openAdd(route)} className={`${ui.btn} ${ui.secondary} ${ui.block}`}>
                <Plus size={16} strokeWidth={2.5} /> Add departure time
              </button>
            </div>
          </section>
        ))}

      {!loading && privateOnly.length > 0 && (
        <section className={`${ui.card} ${s.routeCard}`}>
          <div className={s.routeHead}>
            <div>
              <div className={s.routeName}>Private only</div>
              <div className={s.coverage}>No shared service yet. Add a departure time to start selling seats.</div>
            </div>
          </div>
          {privateOnly.map((route) => (
            <div key={route.routeId} className={s.privateRow}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>
                {route.origin} → {route.destination}
              </span>
              <button type="button" onClick={() => openAdd(route)} className={`${ui.btn} ${ui.secondary} ${ui.small}`}>
                <Plus size={15} strokeWidth={2.5} /> Add
              </button>
            </div>
          ))}
        </section>
      )}

      {adding && (
        <Sheet
          title="Add departure time"
          subtitle={`${adding.origin} → ${adding.destination}`}
          onClose={() => setAdding(null)}
        >
          <form onSubmit={addSchedule} className={ui.form}>
            <div className={ui.fields2}>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="sched-time">Departs at</label>
                <input id="sched-time" type="time" required className={ui.input} value={draft.departureTime} onChange={(e) => setDraft((d) => ({ ...d, departureTime: e.target.value }))} />
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="sched-seats">Seats</label>
                <input id="sched-seats" inputMode="numeric" required className={ui.input} value={draft.capacity} onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))} />
              </div>
            </div>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="sched-price">Price per seat</label>
              <div className={ui.affix}>
                <span>$</span>
                <input id="sched-price" inputMode="decimal" required placeholder="30" value={draft.priceShared} onChange={(e) => setDraft((d) => ({ ...d, priceShared: e.target.value }))} />
              </div>
            </div>
            <div className={ui.field}>
              <span className={ui.label}>Runs on</span>
              <DayPicker days={draft.daysOfWeek} onChange={(daysOfWeek) => daysOfWeek.length > 0 && setDraft((d) => ({ ...d, daysOfWeek }))} />
              <span className={ui.hint}>{daysLabel(draft.daysOfWeek)}</span>
            </div>
            {error && <div className={`${ui.notice} ${ui.noticeError}`} style={{ marginBottom: 0 }}>{error}</div>}
            <div className={ui.sheetActions}>
              <button type="button" onClick={() => setAdding(null)} className={`${ui.btn} ${ui.secondary}`}>Cancel</button>
              <button type="submit" disabled={saving} className={`${ui.btn} ${ui.primary}`}>
                {saving ? "Adding..." : "Add departure time"}
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  );
}

/**
 * Cobertura del inventario: hasta qué día hay salidas creadas.
 *
 * Es el dato que hay que poder ver sin buscarlo: cuando el catálogo se vence,
 * la web deja de tener qué vender y nada más lo avisa.
 */
function CoverageLine({ route }: { route: Coverage }) {
  const until = route.generatedUntil ? new Date(route.generatedUntil) : null;
  // eslint-disable-next-line react-hooks/purity -- "días que quedan" depende de la hora actual a propósito
  const daysLeft = until ? Math.ceil((until.getTime() - Date.now()) / 86400000) : 0;
  const low = daysLeft < 14;

  return (
    <div className={`${s.coverage} ${low ? s.coverageLow : ""}`}>
      {route.upcomingTrips} departures ready
      {until && ` · through ${until.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
      {low && " · generate departures to extend"}
    </div>
  );
}

/** Los 7 días como botones grandes que se prenden y apagan, lunes primero */
function DayPicker({ days, onChange }: { days: number[]; onChange: (days: number[]) => void }) {
  const toggle = (d: number) =>
    onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => a - b));

  return (
    <div className={s.days} role="group" aria-label="Days of the week">
      {WEEK.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => toggle(d)}
          aria-pressed={days.includes(d)}
          aria-label={DAY_LONG[d]}
          title={DAY_LONG[d]}
          className={s.day}
        >
          {DAY_SHORT[d]}
        </button>
      ))}
    </div>
  );
}
