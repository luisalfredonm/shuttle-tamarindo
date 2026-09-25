"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PageHeader from "./ui/PageHeader";
import Toast from "./ui/Toast";
import ui from "./ui/ui.module.css";

const FIELDS = [
  { label: "Name", key: "name", type: "text", placeholder: "Your name", autoComplete: "name" },
  { label: "Notification email", key: "email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
  { label: "WhatsApp / Phone", key: "phone", type: "tel", placeholder: "+506 8888 8888", autoComplete: "tel" },
] as const;

export default function ProfileContent() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const clearNotice = useCallback(() => setNotice(""), []);
  const clearError = useCallback(() => setError(""), []);

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
    try {
      await apiFetch("/admin/profile", { method: "PATCH", body: JSON.stringify(form) });
      setNotice("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your details and where booking alerts are sent." />

      {loading ? (
        <div className={ui.skeleton} style={{ height: 320, maxWidth: 560 }} aria-hidden="true" />
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
          <section className={`${ui.card} ${ui.cardPad}`}>
            <div className={ui.form}>
              {FIELDS.map(({ label, key, type, placeholder, autoComplete }) => (
                <div key={key} className={ui.field}>
                  <label className={ui.label} htmlFor={`profile-${key}`}>{label}</label>
                  <input
                    id={`profile-${key}`}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={ui.input}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className={`${ui.notice} ${ui.noticeInfo}`} style={{ marginTop: "0.85rem" }}>
            <BellRing size={17} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>The notification email receives an alert every time a new booking is confirmed.</span>
          </div>

          <div className={ui.stickyBar}>
            <button type="submit" disabled={saving} className={`${ui.btn} ${ui.primary}`}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}

      {notice && <Toast message={notice} onClose={clearNotice} />}
      {error && <Toast message={error} tone="error" onClose={clearError} />}
    </div>
  );
}
