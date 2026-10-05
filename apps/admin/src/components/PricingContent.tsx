"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import PageHeader from "./ui/PageHeader";
import Stepper from "./ui/Stepper";
import Switch from "./ui/Switch";
import Toast from "./ui/Toast";
import ui from "./ui/ui.module.css";

type Pricing = {
  includedPassengers: number;
  extraPassengerPrice: number;
  vehicleCapacity: number;
  taxEnabled: boolean;
  taxRate: number;
};

type Form = Record<Exclude<keyof Pricing, "taxEnabled">, string> & { taxEnabled: boolean };

export default function PricingContent() {
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const clearNotice = useCallback(() => setNotice(""), []);
  const clearError = useCallback(() => setError(""), []);

  const fill = (p: Pricing) => {
    const f = {
      includedPassengers: String(p.includedPassengers),
      extraPassengerPrice: String(p.extraPassengerPrice),
      vehicleCapacity: String(p.vehicleCapacity),
      taxEnabled: p.taxEnabled,
      taxRate: String(p.taxRate),
    };
    setForm(f);
    setSaved(f);
  };

  useEffect(() => {
    apiFetch("/pricing")
      .then(fill)
      .catch(() => setError("Could not load pricing settings"));
  }, []);

  const set = (key: Exclude<keyof Form, "taxEnabled">) => (value: string) => setForm((f) => f && { ...f, [key]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const updated = await apiFetch("/pricing", {
        method: "PATCH",
        body: JSON.stringify({
          includedPassengers: Number(form.includedPassengers),
          extraPassengerPrice: Number(form.extraPassengerPrice),
          vehicleCapacity: Number(form.vehicleCapacity),
          taxEnabled: form.taxEnabled,
          taxRate: Number(form.taxRate),
        }),
      });
      fill(updated);
      setNotice("Pricing saved. New bookings use these rules.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const dirty = !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved);
  const included = Number(form?.includedPassengers) || 0;
  const extra = Number(form?.extraPassengerPrice) || 0;
  const taxRate = form?.taxEnabled ? Number(form.taxRate) || 0 : 0;
  const exampleSubtotal = 100 + 2 * extra;
  // Mismo redondeo que el API: centavos sobre el subtotal de la reserva
  const exampleTax = Math.round(exampleSubtotal * taxRate) / 100;

  return (
    <div>
      <PageHeader
        title="Pricing"
        subtitle="Private transfer rules and tax, the same for every route. Shared shuttle prices are set per schedule."
      />

      {!form && !error && <div className={ui.skeleton} style={{ height: 420 }} aria-hidden="true" />}

      {form && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
          <div className={ui.stack}>
            <section className={`${ui.card} ${ui.cardPad}`}>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="includedPassengers">Passengers included in the base price</label>
                <Stepper id="includedPassengers" label="included passengers" value={form.includedPassengers} onChange={set("includedPassengers")} min={1} max={50} />
                <span className={ui.hint}>Each route&apos;s one way and round trip price covers up to this many paying passengers.</span>
              </div>
            </section>

            <section className={`${ui.card} ${ui.cardPad}`}>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="extraPassengerPrice">Price per extra passenger</label>
                <div className={ui.affix} style={{ minHeight: 52 }}>
                  <span>$</span>
                  <input id="extraPassengerPrice" inputMode="decimal" required value={form.extraPassengerPrice} onChange={(e) => set("extraPassengerPrice")(e.target.value.replace(/[^\d.]/g, ""))} style={{ fontSize: "1.25rem", fontWeight: 700 }} />
                  <span>per person</span>
                </div>
                <span className={ui.hint}>Charged once per booking for each paying passenger above the included ones, even on a round trip.</span>
              </div>
            </section>

            <section className={`${ui.card} ${ui.cardPad}`}>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="vehicleCapacity">Van capacity</label>
                <Stepper id="vehicleCapacity" label="van capacity" value={form.vehicleCapacity} onChange={set("vehicleCapacity")} min={1} max={50} />
                <span className={ui.hint}>Maximum people in a private transfer, infants (0–2) included.</span>
              </div>
            </section>

            <section className={`${ui.card} ${ui.cardPad}`}>
              <div className={ui.field}>
                <span className={ui.label}>Tax (IVA)</span>
                <Switch
                  checked={form.taxEnabled}
                  onChange={() => setForm((f) => f && { ...f, taxEnabled: !f.taxEnabled })}
                  label={form.taxEnabled ? "Charging tax on new bookings" : "Not charging tax"}
                />
                {form.taxEnabled && (
                  <div className={ui.affix} style={{ minHeight: 52, maxWidth: 200 }}>
                    <input id="taxRate" aria-label="Tax rate" inputMode="decimal" required value={form.taxRate} onChange={(e) => set("taxRate")(e.target.value.replace(/[^\d.]/g, ""))} style={{ fontSize: "1.25rem", fontWeight: 700 }} />
                    <span>%</span>
                  </div>
                )}
                <span className={ui.hint}>Added on top of every price, shared and private, including bookings you add by hand. Past bookings keep the tax they were charged.</span>
              </div>
            </section>

            {/* Cuenta de ejemplo con los valores del formulario, antes de guardar */}
            <section className={`${ui.notice} ${ui.noticeInfo}`} style={{ margin: 0, display: "block" }}>
              <div className={ui.eyebrow} style={{ color: "inherit", opacity: 0.75, marginBottom: 4 }}>Example</div>
              A route priced at $100 with {included + 2} passengers costs{" "}
              <strong>
                $100 + 2 × ${extra} = ${exampleSubtotal}
              </strong>
              {taxRate > 0 && (
                <>
                  {" "}plus {taxRate}% tax (${exampleTax.toFixed(2)}):{" "}
                  <strong>${(exampleSubtotal + exampleTax).toFixed(2)}</strong>
                </>
              )}
              .
            </section>
          </div>

          <div className={ui.stickyBar}>
            {dirty && (
              <button type="button" onClick={() => saved && setForm(saved)} className={`${ui.btn} ${ui.secondary}`}>
                Undo
              </button>
            )}
            <button type="submit" disabled={saving || !dirty} className={`${ui.btn} ${ui.primary}`}>
              {saving ? "Saving..." : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </form>
      )}

      {notice && <Toast message={notice} onClose={clearNotice} />}
      {error && <Toast message={error} tone="error" onClose={clearError} />}
    </div>
  );
}
