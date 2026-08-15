"use client";

import { useEffect, useState } from "react";
import { PenLine, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

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

const emptyForm = {
  routeId: "",
  departureAt: "",
  capacity: "10",
  priceShared: "",
};

const STATUSES = ["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default function TripsContent() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRoute, setFilterRoute] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
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
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (t: Trip) => {
    setEditing(t);
    const local = new Date(t.departureAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    const localStr = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
    setForm({
      routeId: t.route.id,
      departureAt: localStr,
      capacity: String(t.capacity),
      priceShared: String(t.priceShared),
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        ...form,
        capacity: Number(form.capacity),
        priceShared: Number(form.priceShared),
      };
      if (editing) {
        const { routeId, ...updateBody } = body;
        const updated = await apiFetch(`/trips/${editing.id}`, { method: "PATCH", body: JSON.stringify(updateBody) });
        setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        await apiFetch("/trips", { method: "POST", body: JSON.stringify(body) });
        loadTrips();
      }
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Trip) => {
    if (!confirm(`¿Eliminar el viaje ${t.route.origin} → ${t.route.destination}?`)) return;
    try {
      await apiFetch(`/trips/${t.id}`, { method: "DELETE" });
      setTrips((prev) => prev.filter((x) => x.id !== t.id));
    } catch {
      alert("Error al eliminar el viaje");
    }
  };

  const handleStatusChange = async (t: Trip, status: string) => {
    try {
      const updated = await apiFetch(`/trips/${t.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setTrips((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch {
      alert("Error al actualizar el estado");
    }
  };

  const applyFilters = () => loadTrips(filterRoute, filterDate);

  const handleSeed = async () => {
    if (!confirm('Create trips for the next 30 days?')) return;
    try {
      const res = await apiFetch('/trips/seed', { method: 'POST' });
      alert(res.message);
      loadTrips();
    } catch (err: any) {
      alert(err.message || 'Error running seed');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500 }}>Trips</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} style={selectStyle}>
            <option value="">All routes</option>
            {routes.map((r) => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={inputStyle} />
          <button onClick={applyFilters} style={btnSecondary}>Filter</button>
          <button onClick={handleSeed} style={{ ...btnSecondary, color: 'var(--brand-green)', borderColor: 'var(--brand-green)' }}>⚡ Seed 30 days</button>
          <button onClick={openCreate} style={btnPrimary}>+ New Trip</button>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1.5rem" }}>
              {editing ? "Edit Trip" : "New Trip"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {!editing && (
                <div>
                  <label style={labelStyle}>Route</label>
                  <select required value={form.routeId} onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value }))} style={{ ...inputStyle, width: "100%" }}>
                    <option value="">Select a route...</option>
                    {routes.map((r) => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>Departure</label>
                <input required type="datetime-local" value={form.departureAt} onChange={(e) => setForm((f) => ({ ...f, departureAt: e.target.value }))} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
              </div>
              {[
                { label: "Capacity", key: "capacity", placeholder: "10" },
                { label: "Price Shared ($)", key: "priceShared", placeholder: "30" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input required placeholder={placeholder} value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
                </div>
              ))}
              {error && <p style={{ color: "#c0392b", fontSize: "0.8rem" }}>{error}</p>}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <div style={{ ...emptyStyle }}>Loading trips...</div>}
      {!loading && trips.length === 0 && <div style={{ ...emptyStyle }}>No trips found.</div>}

      {!loading && trips.length > 0 && (
        <>
          {/* Tabla: desde tablet para arriba */}
          <div className="hide-mobile" style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border-strong)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 100px 100px 130px 80px", padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--border-soft)", fontSize: "0.75rem", color: "var(--brand-gray)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Route</span><span>Departure</span><span>Seats</span><span>Shared $</span><span>Status</span><span></span>
            </div>

            {trips.map((t, i) => {
              const dep = new Date(t.departureAt);
              const available = t.capacity - t.bookedSeats;
              const occupancy = Math.round((t.bookedSeats / t.capacity) * 100);
              return (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 100px 100px 130px 80px", padding: "0.875rem 1.5rem", alignItems: "center", borderBottom: i < trips.length - 1 ? "1px solid var(--border-soft)" : "none", fontSize: "0.875rem" }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: "2px" }}>{t.route?.origin} → {t.route?.destination}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}>{t.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ marginBottom: "2px" }}>{dep.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}>{dep.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div>
                    <div style={{ marginBottom: "4px", fontWeight: 500 }}>
                      <span style={{ color: available <= 2 ? "#c0392b" : "var(--brand-green)" }}>{available}</span>
                      <span style={{ color: "var(--brand-gray)", fontWeight: 400 }}>/{t.capacity}</span>
                    </div>
                    <div style={{ height: "4px", background: "var(--border-soft)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "2px", width: occupancy + "%", background: occupancy > 80 ? "#c0392b" : occupancy > 50 ? "#e67e22" : "var(--brand-green)" }} />
                    </div>
                  </div>
                  <span style={{ color: "var(--brand-green)", fontWeight: 600 }}>${t.priceShared}</span>
                  <select value={t.status} onChange={(e) => handleStatusChange(t, e.target.value)} style={{ ...selectStyle, fontSize: "0.75rem", padding: "3px 8px", color: statusColor(t.status), background: statusBg(t.status), border: "none", borderRadius: "100px", fontWeight: 500 }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => openEdit(t)} style={iconBtn}><PenLine size={14} /></button>
                    <button onClick={() => handleDelete(t)} style={iconBtn}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tarjetas: solo telefono. La grilla de 6 columnas de la tabla no
              entra en un viewport angosto, asi que abajo de 768px se apila */}
          <div className="hide-desktop" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {trips.map((t) => {
              const dep = new Date(t.departureAt);
              const available = t.capacity - t.bookedSeats;
              const occupancy = Math.round((t.bookedSeats / t.capacity) * 100);
              return (
                <div key={t.id} style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border-strong)", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: "2px" }}>{t.route?.origin} → {t.route?.destination}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}>{t.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                    <select value={t.status} onChange={(e) => handleStatusChange(t, e.target.value)} style={{ ...selectStyle, flexShrink: 0, fontSize: "0.72rem", padding: "3px 8px", color: statusColor(t.status), background: statusBg(t.status), border: "none", borderRadius: "100px", fontWeight: 500 }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <MobileField label="Departure">
                      {dep.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <div style={{ fontSize: "0.72rem", color: "var(--brand-gray)", fontWeight: 400 }}>
                        {dep.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </MobileField>
                    <MobileField label="Seats">
                      <span style={{ color: available <= 2 ? "#c0392b" : "var(--brand-green)" }}>{available}</span>
                      <span style={{ color: "var(--brand-gray)", fontWeight: 400 }}>/{t.capacity}</span>
                      <div style={{ height: "4px", background: "var(--border-soft)", borderRadius: "2px", overflow: "hidden", marginTop: "4px" }}>
                        <div style={{ height: "100%", borderRadius: "2px", width: occupancy + "%", background: occupancy > 80 ? "#c0392b" : occupancy > 50 ? "#e67e22" : "var(--brand-green)" }} />
                      </div>
                    </MobileField>
                    <MobileField label="Shared $">
                      <span style={{ color: "var(--brand-green)" }}>${t.priceShared}</span>
                    </MobileField>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", borderTop: "1px solid var(--border-soft)", paddingTop: "0.65rem" }}>
                    <button onClick={() => openEdit(t)} style={mobileActionBtn}><PenLine size={14} /> Edit</button>
                    <button onClick={() => handleDelete(t)} style={{ ...mobileActionBtn, color: "#c0392b" }}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "0.68rem", color: "var(--brand-gray)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{children}</div>
    </div>
  );
}

const statusColor = (s: string) => s === "SCHEDULED" ? "#1a6b4a" : s === "CONFIRMED" ? "#1a4a6b" : s === "CANCELLED" ? "#c0392b" : "#666";
const statusBg = (s: string) => s === "SCHEDULED" ? "#f0faf5" : s === "CONFIRMED" ? "#f0f5fa" : s === "CANCELLED" ? "#fff0f0" : "#f5f5f5";

const btnPrimary: React.CSSProperties = { background: "var(--brand-gold)", color: "var(--brand-dark)", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" };
const btnSecondary: React.CSSProperties = { padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: "0.875rem", cursor: "pointer" };
const inputStyle: React.CSSProperties = { padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-strong)", fontSize: "0.875rem" };
const selectStyle: React.CSSProperties = { padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-strong)", fontSize: "0.875rem", background: "var(--surface)" };
const labelStyle: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 500, display: "block", marginBottom: "4px" };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" };
const modal: React.CSSProperties = { background: "var(--surface)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "480px", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" };
const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0 2px" };
const emptyStyle: React.CSSProperties = { padding: "2rem", textAlign: "center", color: "var(--brand-gray)", fontSize: "0.875rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border-strong)" };
const mobileActionBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "5px", background: "none", border: "1px solid var(--border-strong)", borderRadius: "8px", padding: "6px 10px", fontSize: "0.8rem", cursor: "pointer", color: "var(--text-2)" };


