"use client";

import Sheet from "../ui/Sheet";
import ui from "../ui/ui.module.css";
import type { RouteForm } from "./types";
import s from "./routes.module.css";

type Props = {
  editing: boolean;
  form: RouteForm;
  saving: boolean;
  error: string;
  onChange: (patch: Partial<RouteForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

/** Igual que en el API: así se ve antes de guardar cómo va a quedar el slug */
const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function RouteFormModal({ editing, form, saving, error, onChange, onSubmit, onClose }: Props) {
  const field = (key: keyof RouteForm) => ({
    id: `route-${key}`,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [key]: e.target.value }),
  });

  const normalizedSlug = toSlug(form.slug);

  return (
    <Sheet
      title={editing ? "Edit route" : "New route"}
      subtitle="What customers see and pay when they book this route."
      onClose={onClose}
    >
        <form onSubmit={onSubmit} className={s.form}>
          <fieldset className={s.group}>
            <legend className={s.groupTitle}>Route</legend>
            <div className={s.row2}>
              <div>
                <label className={s.label} htmlFor="route-origin">From</label>
                <input className={ui.input} required placeholder="Tamarindo" autoFocus {...field("origin")} />
              </div>
              <div>
                <label className={s.label} htmlFor="route-destination">To</label>
                <input className={ui.input} required placeholder="Aeropuerto Liberia (LIR)" {...field("destination")} />
              </div>
            </div>
            <div>
              <label className={s.label} htmlFor="route-slug">Web address</label>
              <div className={ui.affix}>
                <span>/routes/</span>
                <input required placeholder="tamarindo-liberia-airport" {...field("slug")} />
              </div>
              {form.slug && normalizedSlug !== form.slug && (
                <p className={s.hint}>
                  Se guardará como: <code>{normalizedSlug || "—"}</code>
                </p>
              )}
            </div>
          </fieldset>

          <fieldset className={s.group}>
            <legend className={s.groupTitle}>Trip</legend>
            <div className={s.row2}>
              <div>
                <label className={s.label} htmlFor="route-durationMin">Duration</label>
                <div className={ui.affix}>
                  <input required inputMode="numeric" placeholder="90" {...field("durationMin")} />
                  <span>min</span>
                </div>
              </div>
              <div>
                <label className={s.label} htmlFor="route-distanceKm">Distance</label>
                <div className={ui.affix}>
                  <input required inputMode="numeric" placeholder="78" {...field("distanceKm")} />
                  <span>km</span>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className={s.group}>
            <legend className={s.groupTitle}>Private transfer price</legend>
            <div className={s.row2}>
              <div>
                <label className={s.label} htmlFor="route-pricePrivate">One way</label>
                <div className={ui.affix}>
                  <span>$</span>
                  <input required inputMode="decimal" placeholder="100" {...field("pricePrivate")} />
                </div>
              </div>
              <div>
                <label className={s.label} htmlFor="route-pricePrivateRoundTrip">
                  Round trip <span className={s.optional}>(optional)</span>
                </label>
                <div className={ui.affix}>
                  <span>$</span>
                  <input inputMode="decimal" placeholder="180" {...field("pricePrivateRoundTrip")} />
                </div>
              </div>
            </div>
            <p className={s.hint} style={{ marginTop: 0 }}>
              Se copia a la ruta inversa. Vacío = no se vende ida y vuelta privado.
            </p>
          </fieldset>

          {error && <p className={s.formError}>{error}</p>}

          <div className={ui.sheetActions}>
            <button type="button" onClick={onClose} className={`${ui.btn} ${ui.secondary}`}>Cancel</button>
            <button type="submit" disabled={saving} className={`${ui.btn} ${ui.primary}`}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create route"}
            </button>
          </div>
        </form>
    </Sheet>
  );
}
