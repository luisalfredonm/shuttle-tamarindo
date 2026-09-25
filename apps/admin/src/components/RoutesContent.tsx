"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import RouteCard from "./routes/RouteCard";
import RouteFormModal from "./routes/RouteFormModal";
import { emptyRouteForm, type AdminRoute } from "./routes/types";
import PageHeader from "./ui/PageHeader";
import ui from "./ui/ui.module.css";
import s from "./routes/routes.module.css";

export default function RoutesContent() {
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminRoute | null>(null);
  const [form, setForm] = useState(emptyRouteForm);
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
    setForm(emptyRouteForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (r: AdminRoute) => {
    setEditing(r);
    setForm({
      slug: r.slug,
      origin: r.origin,
      destination: r.destination,
      durationMin: String(r.durationMin),
      distanceKm: String(r.distanceKm),
      pricePrivate: String(r.pricePrivate),
      pricePrivateRoundTrip: r.pricePrivateRoundTrip === null ? "" : String(r.pricePrivateRoundTrip),
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
        durationMin: Number(form.durationMin),
        distanceKm: Number(form.distanceKm),
        pricePrivate: Number(form.pricePrivate),
        pricePrivateRoundTrip: form.pricePrivateRoundTrip.trim() === "" ? null : Number(form.pricePrivateRoundTrip),
      };
      if (editing) {
        await apiFetch(`/routes/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/routes", { method: "POST", body: JSON.stringify(body) });
      }
      // Se recarga todo: guardar el round trip también cambia la ruta inversa
      load();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: AdminRoute) => {
    if (!confirm(`¿Eliminar la ruta "${r.origin} → ${r.destination}"?`)) return;
    try {
      await apiFetch(`/routes/${r.id}`, { method: "DELETE" });
      setRoutes((prev) => prev.filter((x) => x.id !== r.id));
    } catch {
      alert("Error al eliminar la ruta");
    }
  };

  const toggleActive = async (r: AdminRoute) => {
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

  const live = routes.filter((r) => r.isActive).length;
  const withRoundTrip = routes.filter((r) => r.pricePrivateRoundTrip !== null).length;

  return (
    <div>
      <PageHeader
        title="Routes"
        subtitle="The trips customers can book on the website, with the photo and private prices they see."
        summary={
          !loading && routes.length > 0 && (
            <>
              <span className={ui.chip}><span className={ui.chipDot} /> {live} of {routes.length} live</span>
              <span className={ui.chip}>{withRoundTrip} with private round trip</span>
            </>
          )
        }
        actions={
          <button type="button" onClick={openCreate} className={`${ui.btn} ${ui.primary}`}>
            <Plus size={16} strokeWidth={2.5} /> New route
          </button>
        }
      />

      {showForm && (
        <RouteFormModal
          editing={!!editing}
          form={form}
          saving={saving}
          error={error}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className={s.grid} aria-busy={loading}>
        {loading &&
          [0, 1, 2].map((i) => <div key={i} className={s.skeleton} aria-hidden="true" />)}

        {!loading && routes.length === 0 && (
          <div className={s.empty}>
            <h2>No routes yet</h2>
            <p>Add the first route to start selling transfers on the website.</p>
            <button type="button" onClick={openCreate} className={`${ui.btn} ${ui.primary}`}>
              <Plus size={16} strokeWidth={2.5} /> New route
            </button>
          </div>
        )}

        {!loading &&
          routes.map((r) => (
            <RouteCard
              key={r.id}
              route={r}
              onEdit={() => openEdit(r)}
              onDelete={() => handleDelete(r)}
              onToggleActive={() => toggleActive(r)}
              onImageChange={(updated) =>
                setRoutes((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)))
              }
            />
          ))}
      </div>
    </div>
  );
}
