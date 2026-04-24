"use client";

import { useEffect, useState } from "react";
import { ArrowDown, PenLine, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Route = {
  id: string;
  slug: string;
  origin: string;
  destination: string;
  durationMin: number;
  distanceKm: number;
  isActive: boolean;
};

const emptyForm = { slug: "", origin: "", destination: "", durationMin: "", distanceKm: "" };

export default function RoutesContent() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    apiFetch("/routes")
      .then((data) => setRoutes(Array.isArray(data) ? data : []))
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (r: Route) => {
    setEditing(r);
    setForm({
      slug: "",
      origin: r.origin,
      destination: r.destination,
      durationMin: String(r.durationMin),
      distanceKm: String(r.distanceKm),
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { slug, ...editFields } = form;
      const body = editing
        ? { ...editFields, durationMin: Number(form.durationMin), distanceKm: Number(form.distanceKm) }
        : { ...form, durationMin: Number(form.durationMin), distanceKm: Number(form.distanceKm) };
      if (editing) {
        const updated = await apiFetch(`/routes/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
        setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        await apiFetch("/routes", { method: "POST", body: JSON.stringify(body) });
        load();
      }
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: Route) => {
    if (!confirm(`¿Eliminar la ruta "${r.origin} → ${r.destination}"?`)) return;
    try {
      await apiFetch(`/routes/${r.id}`, { method: "DELETE" });
      setRoutes((prev) => prev.filter((x) => x.id !== r.id));
    } catch {
      alert("Error al eliminar la ruta");
    }
  };

  const toggleActive = async (r: Route) => {
    try {
      const updated = await apiFetch(`/routes/${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !r.isActive }),
      });
      setRoutes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch {
      alert("Error al actualizar la ruta");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500 }}>Routes</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--brand-gray)" }}>{routes.length} routes</span>
          <button onClick={openCreate} style={btnPrimary}>+ New Route</button>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1.5rem" }}>
              {editing ? "Edit Route" : "New Route"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "Slug", key: "slug", placeholder: "tamarindo-liberia-airport" },
                { label: "Origin", key: "origin", placeholder: "Tamarindo" },
                { label: "Destination", key: "destination", placeholder: "Aeropuerto Liberia (LIR)" },
                { label: "Duration (min)", key: "durationMin", placeholder: "90" },
                { label: "Distance (km)", key: "distanceKm", placeholder: "78" },
              ].filter(({ key }) => !editing || key !== "slug").map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>{label}</label>
                  <input
                    required
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    style={input}
                  />
                </div>
              ))}
              {error && <p style={{ color: "#c0392b", fontSize: "0.8rem" }}>{error}</p>}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {loading && <div style={{ padding: "2rem", color: "var(--brand-gray)", fontSize: "0.875rem" }}>Loading routes...</div>}
        {!loading && routes.map((r) => (
          <div key={r.id} style={{ background: "var(--surface)", borderRadius: "14px", padding: "1.5rem", border: "1px solid var(--border-strong)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: "0.95rem", marginBottom: "2px" }}>{r.origin}</div>
                <div style={{ color: "var(--brand-gold)", marginBottom: "2px" }}><ArrowDown size={15} /></div>
                <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>{r.destination}</div>
              </div>
              <button onClick={() => toggleActive(r)} style={badge(r.isActive)}>
                {r.isActive ? "Active" : "Inactive"}
              </button>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-soft)", fontSize: "0.8rem", color: "var(--brand-gray)" }}>
              <span>{Math.floor(r.durationMin / 60)}h {r.durationMin % 60 > 0 ? (r.durationMin % 60) + "m" : ""}</span>
              <span>{r.distanceKm} km</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.75rem", flex: 1 }}>{r.slug}</span>
              <button onClick={() => openEdit(r)} style={iconBtn}><PenLine size={14} /></button>
              <button onClick={() => handleDelete(r)} style={iconBtn}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Styles
const btnPrimary: React.CSSProperties = {
  background: "var(--brand-gold)", color: "var(--brand-dark)", border: "none",
  borderRadius: "8px", padding: "8px 16px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: "0.875rem", cursor: "pointer",
};
const input: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "1px solid var(--border-strong)", fontSize: "0.875rem", boxSizing: "border-box",
};
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
};
const modal: React.CSSProperties = {
  background: "var(--surface)", borderRadius: "16px", padding: "2rem",
  width: "100%", maxWidth: "480px", boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
};
const iconBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0 2px",
};
const badge = (active: boolean): React.CSSProperties => ({
  background: active ? "#f0faf5" : "#fff0f0",
  color: active ? "#1a6b4a" : "#c0392b",
  padding: "3px 10px", borderRadius: "100px",
  fontSize: "0.75rem", fontWeight: 500, border: "none", cursor: "pointer",
});


