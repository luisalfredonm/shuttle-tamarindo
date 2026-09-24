"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Pricing = {
  includedPassengers: number;
  extraPassengerPrice: number;
  vehicleCapacity: number;
};

const FIELDS: { key: keyof Pricing; label: string; hint: string; step?: string }[] = [
  {
    key: "includedPassengers",
    label: "Passengers included in the base price",
    hint: "The one way and round trip price of each route covers up to this many paying passengers.",
  },
  {
    key: "extraPassengerPrice",
    label: "Price per extra passenger ($)",
    hint: "Charged once per booking for each paying passenger above the included ones, even on a round trip.",
    step: "0.01",
  },
  {
    key: "vehicleCapacity",
    label: "Van capacity",
    hint: "Maximum people in a private transfer, infants (0–2) included.",
  },
];

export default function PricingContent() {
  const [form, setForm] = useState<Record<keyof Pricing, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fill = (p: Pricing) =>
    setForm({
      includedPassengers: String(p.includedPassengers),
      extraPassengerPrice: String(p.extraPassengerPrice),
      vehicleCapacity: String(p.vehicleCapacity),
    });

  useEffect(() => {
    apiFetch("/pricing")
      .then(fill)
      .catch(() => setError("Could not load pricing settings"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await apiFetch("/pricing", {
        method: "PATCH",
        body: JSON.stringify({
          includedPassengers: Number(form.includedPassengers),
          extraPassengerPrice: Number(form.extraPassengerPrice),
          vehicleCapacity: Number(form.vehicleCapacity),
        }),
      });
      fill(updated);
      setSaved(true);
    } catch (err: any) {
      setError(err.message || "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const example =
    form &&
    (() => {
      const included = Number(form.includedPassengers) || 0;
      const extra = Number(form.extraPassengerPrice) || 0;
      const pax = included + 1;
      return `Example: base $100 with ${pax} passengers = $100 + 1 × $${extra} = $${100 + extra}`;
    })();

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500 }}>Pricing</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--brand-gray)", marginTop: "4px" }}>
          Private transfer rules, the same for every route. Shared shuttle prices are set per schedule.
        </p>
      </div>

      {!form && !error && <div style={{ color: "var(--brand-gray)", fontSize: "0.875rem" }}>Loading...</div>}

      {form && (
        <form onSubmit={handleSubmit} style={card}>
          {FIELDS.map(({ key, label, hint, step }) => (
            <div key={key}>
              <label htmlFor={key} style={{ fontSize: "0.8rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>
                {label}
              </label>
              <input
                id={key}
                type="number"
                min={key === "extraPassengerPrice" ? 0 : 1}
                step={step ?? "1"}
                required
                value={form[key]}
                onChange={(e) => {
                  setSaved(false);
                  setForm((f) => f && { ...f, [key]: e.target.value });
                }}
                style={input}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--brand-gray)", marginTop: "4px" }}>{hint}</p>
            </div>
          ))}

          {example && <p style={{ fontSize: "0.8rem", color: "var(--brand-dark)" }}>{example}</p>}

          {error && <p style={{ color: "#c0392b", fontSize: "0.8rem" }}>{error}</p>}

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
            {saved && <span style={{ fontSize: "0.8rem", color: "#1a6b4a" }}>Saved</span>}
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {!form && error && <p style={{ color: "#c0392b", fontSize: "0.85rem" }}>{error}</p>}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: "14px",
  padding: "1.5rem",
  border: "1px solid var(--border-strong)",
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
  maxWidth: "560px",
};
const input: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "1px solid var(--border-strong)", fontSize: "0.875rem", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  background: "var(--brand-gold)", color: "var(--brand-dark)", border: "none",
  borderRadius: "8px", padding: "8px 16px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
};
