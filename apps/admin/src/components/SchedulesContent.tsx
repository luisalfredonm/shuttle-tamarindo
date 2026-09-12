"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Plus, RefreshCw, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Schedule = {
  id: string;
  routeId: string;
  departureTime: string;
  priceShared: string | number;
  capacity: number;
  isActive: boolean;
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

const emptyDraft = { departureTime: "", priceShared: "", capacity: "10" };

export default function SchedulesContent() {
  const [routes, setRoutes] = useState<Coverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  // Borrador del formulario de alta, uno por ruta
  const [drafts, setDrafts] = useState<Record<string, typeof emptyDraft>>({});
  const [savingRoute, setSavingRoute] = useState<string | null>(null);

  const load = () =>
    apiFetch("/schedules/coverage")
      .then((data) => setRoutes(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Could not load schedules"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const draftFor = (routeId: string) => drafts[routeId] ?? emptyDraft;

  const setDraft = (routeId: string, patch: Partial<typeof emptyDraft>) =>
    setDrafts((prev) => ({
      ...prev,
      [routeId]: { ...(prev[routeId] ?? emptyDraft), ...patch },
    }));

  const addSchedule = async (route: Coverage) => {
    const draft = draftFor(route.routeId);
    if (!draft.departureTime || !draft.priceShared) {
      setError("Enter the departure time and the price");
      return;
    }

    setSavingRoute(route.routeId);
    setError("");
    setNotice("");
    try {
      await apiFetch(`/routes/${route.routeId}/schedules`, {
        method: "POST",
        body: JSON.stringify({
          departureTime: draft.departureTime,
          priceShared: Number(draft.priceShared),
          capacity: Number(draft.capacity),
        }),
      });
      setDrafts((prev) => ({ ...prev, [route.routeId]: emptyDraft }));
      // Las salidas de ese horario todavía no existen: se generan en el acto
      // para que el horario nuevo se pueda vender sin esperar al job nocturno
      const result = await apiFetch("/schedules/generate", {
        method: "POST",
        body: JSON.stringify({ routeId: route.routeId }),
      });
      setNotice(
        `Schedule added. ${result.created} departures are ready to sell.`,
      );
      await load();
    } catch (err: any) {
      setError(err.message || "Could not add the schedule");
    } finally {
      setSavingRoute(null);
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
    } catch (err: any) {
      setError(err.message || "Could not update the schedule");
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
      const result = await apiFetch(`/schedules/${schedule.id}`, {
        method: "DELETE",
      });
      setNotice(
        `Schedule removed. ${result.deletedTrips} future departures with no bookings were deleted.`,
      );
      await load();
    } catch (err: any) {
      setError(err.message || "Could not remove the schedule");
    }
  };

  const generateAll = async () => {
    setGenerating(true);
    setError("");
    setNotice("");
    try {
      const result = await apiFetch("/schedules/generate", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setNotice(
        result.created === 0
          ? `All caught up: departures already cover the next ${result.windowDays} days.`
          : `${result.created} departures generated for the next ${result.windowDays} days.`,
      );
      await load();
    } catch (err: any) {
      setError(err.message || "Could not generate departures");
    } finally {
      setGenerating(false);
    }
  };

  const shared = routes.filter((r) => r.schedules.length > 0);
  const privateOnly = routes.filter((r) => r.schedules.length === 0);

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 500 }}>Schedules</h1>
          <p style={subtitle}>
            Set a departure time once and the system creates that day-by-day
            departure for you. No more adding trips one at a time.
          </p>
        </div>
        <button
          onClick={generateAll}
          disabled={generating}
          style={{ ...btnPrimary, opacity: generating ? 0.6 : 1 }}
        >
          <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
          {generating ? "Generating..." : "Generate departures"}
        </button>
      </div>

      {notice && <div style={noticeBox}>{notice}</div>}
      {error && <div style={errorBox}>{error}</div>}

      {loading && <div style={muted}>Loading schedules...</div>}

      {!loading && shared.map((route) => (
        <section key={route.routeId} style={card}>
          <div style={cardHead}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.95rem" }}>{route.origin}</strong>
              <ArrowRight size={15} color="var(--brand-gold)" />
              <strong style={{ fontSize: "0.95rem" }}>{route.destination}</strong>
            </div>
            <CoverageBadge route={route} />
          </div>

          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Departs</th>
                <th style={th}>Price</th>
                <th style={th}>Seats</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: "right" }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {route.schedules.map((s) => (
                <tr key={s.id}>
                  <td style={{ ...td, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                    {s.departureTime}
                  </td>
                  <td style={td}>${Number(s.priceShared).toFixed(2)}</td>
                  <td style={td}>{s.capacity}</td>
                  <td style={td}>
                    <button onClick={() => toggleSchedule(s)} style={badge(s.isActive)}>
                      {s.isActive ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button
                      onClick={() => removeSchedule(route, s)}
                      style={iconBtn}
                      aria-label={`Remove the ${s.departureTime} departure`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <AddRow
            draft={draftFor(route.routeId)}
            saving={savingRoute === route.routeId}
            onChange={(patch) => setDraft(route.routeId, patch)}
            onAdd={() => addSchedule(route)}
          />
        </section>
      ))}

      {!loading && privateOnly.length > 0 && (
        <section style={{ ...card, background: "var(--surface)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.35rem" }}>
            Private only
          </h2>
          <p style={{ ...subtitle, marginBottom: "1.25rem" }}>
            These routes have no shared service. Add a departure time to start
            selling individual seats.
          </p>

          {privateOnly.map((route) => (
            <div key={route.routeId} style={privateRow}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.9rem" }}>{route.origin}</span>
                <ArrowRight size={13} color="var(--brand-gray)" />
                <span style={{ fontSize: "0.9rem" }}>{route.destination}</span>
              </div>
              <AddRow
                compact
                draft={draftFor(route.routeId)}
                saving={savingRoute === route.routeId}
                onChange={(patch) => setDraft(route.routeId, patch)}
                onAdd={() => addSchedule(route)}
              />
            </div>
          ))}
        </section>
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
function CoverageBadge({ route }: { route: Coverage }) {
  const until = route.generatedUntil ? new Date(route.generatedUntil) : null;
  const daysLeft = until
    ? Math.ceil((until.getTime() - Date.now()) / 86400000)
    : 0;
  const low = daysLeft < 14;

  return (
    <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--brand-gray)" }}>
      <div style={{ fontWeight: 600, color: low ? "#c0392b" : "var(--brand-gray)" }}>
        {route.upcomingTrips} departures · {daysLeft} days of inventory
      </div>
      {until && (
        <div>
          through{" "}
          {until.toLocaleDateString("en-US", { day: "numeric", month: "short" })}
        </div>
      )}
      {low && <div style={{ color: "#c0392b" }}>Generate departures to extend</div>}
    </div>
  );
}

function AddRow({
  draft,
  saving,
  compact,
  onChange,
  onAdd,
}: {
  draft: typeof emptyDraft;
  saving: boolean;
  compact?: boolean;
  onChange: (patch: Partial<typeof emptyDraft>) => void;
  onAdd: () => void;
}) {
  return (
    <div style={{ ...addRow, marginTop: compact ? 0 : "1rem", borderTop: compact ? "none" : "1px solid var(--border-soft)", paddingTop: compact ? 0 : "1rem" }}>
      <input
        type="time"
        value={draft.departureTime}
        onChange={(e) => onChange({ departureTime: e.target.value })}
        style={{ ...input, width: compact ? "110px" : "130px" }}
        aria-label="Departure time"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Price"
        value={draft.priceShared}
        onChange={(e) => onChange({ priceShared: e.target.value })}
        style={{ ...input, width: "100px" }}
        aria-label="Price per seat"
      />
      <input
        type="number"
        min="1"
        placeholder="Seats"
        value={draft.capacity}
        onChange={(e) => onChange({ capacity: e.target.value })}
        style={{ ...input, width: "100px" }}
        aria-label="Seats in the vehicle"
      />
      <button onClick={onAdd} disabled={saving} style={{ ...btnSecondary, opacity: saving ? 0.6 : 1 }}>
        <Plus size={14} style={{ marginRight: 4, verticalAlign: "-2px" }} />
        {saving ? "Adding..." : "Add"}
      </button>
    </div>
  );
}

// Styles
const header: React.CSSProperties = {
  marginBottom: "1.5rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  flexWrap: "wrap",
};
const subtitle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "var(--brand-gray)",
  marginTop: "0.35rem",
  maxWidth: "52ch",
  lineHeight: 1.5,
};
const card: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: "14px",
  padding: "1.5rem",
  border: "1px solid var(--border-strong)",
  marginBottom: "1rem",
};
const cardHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  flexWrap: "wrap",
  marginBottom: "1rem",
};
const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.85rem",
};
const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.75rem 0.5rem 0",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--brand-gray)",
  fontWeight: 600,
  borderBottom: "1px solid var(--border-soft)",
};
const td: React.CSSProperties = {
  padding: "0.6rem 0.75rem 0.6rem 0",
  borderBottom: "1px solid var(--border-soft)",
};
const addRow: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
  flexWrap: "wrap",
};
const privateRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  flexWrap: "wrap",
  padding: "0.75rem 0",
  borderTop: "1px solid var(--border-soft)",
};
const btnPrimary: React.CSSProperties = {
  background: "var(--brand-gold)",
  color: "var(--brand-dark)",
  border: "none",
  borderRadius: "8px",
  padding: "8px 16px",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  fontSize: "0.875rem",
  cursor: "pointer",
};
const input: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border-strong)",
  fontSize: "0.875rem",
  boxSizing: "border-box",
};
const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "0 2px",
  color: "var(--brand-gray)",
};
const muted: React.CSSProperties = {
  padding: "2rem",
  color: "var(--brand-gray)",
  fontSize: "0.875rem",
};
const noticeBox: React.CSSProperties = {
  background: "#f0faf5",
  color: "#1a6b4a",
  border: "1px solid #cdeadd",
  borderRadius: "10px",
  padding: "0.75rem 1rem",
  fontSize: "0.85rem",
  marginBottom: "1rem",
};
const errorBox: React.CSSProperties = {
  background: "#fff0f0",
  color: "#c0392b",
  border: "1px solid #f5d2d2",
  borderRadius: "10px",
  padding: "0.75rem 1rem",
  fontSize: "0.85rem",
  marginBottom: "1rem",
};
const badge = (active: boolean): React.CSSProperties => ({
  background: active ? "#f0faf5" : "#fff7e6",
  color: active ? "#1a6b4a" : "#8a6100",
  padding: "3px 10px",
  borderRadius: "100px",
  fontSize: "0.75rem",
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
});
