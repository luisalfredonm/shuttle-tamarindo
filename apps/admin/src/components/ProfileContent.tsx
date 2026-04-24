"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ProfileContent() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/admin/profile")
      .then((data) => setForm({ name: data.name || "", email: data.email || "", phone: data.phone || "" }))
      .catch(() => setError("Error loading profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await apiFetch("/admin/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500 }}>Profile</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--brand-gray)", marginTop: "4px" }}>
          Your info and notification settings
        </p>
      </div>

      <div style={{ maxWidth: "480px", background: "var(--surface)", borderRadius: "16px", padding: "2rem", border: "1px solid var(--border-strong)" }}>
        {loading ? (
          <p style={{ color: "var(--brand-gray)", fontSize: "0.875rem" }}>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              { label: "Name", key: "name", type: "text", placeholder: "Your name" },
              { label: "Notification email", key: "email", type: "email", placeholder: "you@example.com" },
              { label: "WhatsApp / Phone", key: "phone", type: "tel", placeholder: "+506 8888 8888" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}

            <p style={{ fontSize: "0.78rem", color: "var(--brand-gray)", margin: 0 }}>
              The notification email receives an alert every time a new booking is confirmed.
            </p>

            {error && <p style={{ color: "#c0392b", fontSize: "0.8rem", margin: 0 }}>{error}</p>}
            {success && <p style={{ color: "#1a6b4a", fontSize: "0.8rem", margin: 0 }}>Profile saved successfully.</p>}

            <button
              type="submit"
              disabled={saving}
              style={{
                background: "var(--brand-gold)", color: "var(--brand-dark)", border: "none",
                borderRadius: "8px", padding: "10px 20px", fontSize: "0.875rem",
                fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1, alignSelf: "flex-start",
              }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.8rem", fontWeight: 500, display: "block", marginBottom: "4px",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid var(--border-strong)", fontSize: "0.875rem", boxSizing: "border-box",
};

