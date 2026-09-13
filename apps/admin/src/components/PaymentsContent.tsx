"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, CreditCard, PlugZap, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Method = {
  provider: "PAYPAL" | "BAC_CREDOMATIC";
  label: string;
  isEnabled: boolean;
  mode: "sandbox" | "live" | null;
  publicKeyHint: string | null;
  isSupported: boolean;
  hasCredentials: boolean;
  updatedAt: string | null;
};

type TestResult = { ok: boolean; detail: string };

/**
 * Metodos de pago.
 *
 * Desde aca solo se prende o apaga cada metodo. Credenciales, modo sandbox/live
 * y clientId se leen de las variables de entorno del servidor: la pantalla los
 * muestra pero no los edita, para que ningun secreto pase por el navegador y el
 * panel no pueda decir "live" mientras el servidor tiene las de sandbox.
 */
export default function PaymentsContent() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, TestResult>>({});

  const load = () =>
    apiFetch("/payments/config")
      .then((data) => setMethods(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Could not load payment methods"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (m: Method) => {
    const next = !m.isEnabled;
    if (!next && !confirm(`Turn off ${m.label}? Customers won't be able to pay with it until you turn it back on.`)) {
      return;
    }

    setSaving(m.provider);
    setError("");
    try {
      await apiFetch(`/payments/config/${m.provider}`, {
        method: "PATCH",
        body: JSON.stringify({ isEnabled: next }),
      });
      await load();
    } catch (err: any) {
      setError(err.message || `Could not update ${m.label}`);
    } finally {
      setSaving(null);
    }
  };

  const test = async (m: Method) => {
    setTesting(m.provider);
    try {
      const result = await apiFetch(`/payments/config/${m.provider}/verify`, {
        method: "POST",
      });
      setTests((prev) => ({ ...prev, [m.provider]: result }));
    } catch (err: any) {
      setTests((prev) => ({
        ...prev,
        [m.provider]: { ok: false, detail: err.message || "Connection test failed" },
      }));
    } finally {
      setTesting(null);
    }
  };

  const anyEnabled = methods.some((m) => m.isEnabled && m.hasCredentials);
  const anyLive = methods.some((m) => m.isEnabled && m.mode === "live");
  const anySandboxOn = methods.some((m) => m.isEnabled && m.mode === "sandbox");

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 500 }}>Payments</h1>
          <p style={subtitle}>
            Choose which payment methods customers can use at checkout.
          </p>
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {!loading && !anyEnabled && (
        <div style={warnBox}>
          <CircleAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>No payment method is on.</strong> Customers can book but
            cannot pay. Turn on a method below to start taking payments.
          </span>
        </div>
      )}

      {!loading && anySandboxOn && !anyLive && (
        <div style={infoBox}>
          <CircleAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>Test mode.</strong> Payments go through the PayPal sandbox
            and no real money moves. Switch to live credentials on the server
            before launch.
          </span>
        </div>
      )}

      {loading && <div style={muted}>Loading payment methods...</div>}

      <div style={grid}>
        {methods.map((m) => {
          const result = tests[m.provider];
          const canEnable = m.isSupported && m.hasCredentials;

          return (
            <section key={m.provider} style={card}>
              <div style={cardHead}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <CreditCard size={18} color="var(--brand-gold)" />
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 600 }}>{m.label}</h2>
                </div>
                {m.isSupported ? (
                  <span style={pill(m.isEnabled ? "on" : "off")}>
                    {m.isEnabled ? "On" : "Off"}
                  </span>
                ) : (
                  <span style={pill("soon")}>Coming soon</span>
                )}
              </div>

              {m.isSupported ? (
                <>
                  <dl style={facts}>
                    <div style={fact}>
                      <dt style={factLabel}>Mode</dt>
                      <dd style={factValue}>
                        {m.mode ? (
                          <span style={pill(m.mode === "live" ? "live" : "sandbox")}>
                            {m.mode === "live" ? "Live" : "Sandbox"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div style={fact}>
                      <dt style={factLabel}>Credentials</dt>
                      <dd style={{ ...factValue, color: m.hasCredentials ? "#1a6b4a" : "#c0392b" }}>
                        {m.hasCredentials ? "Loaded on the server" : "Missing on the server"}
                      </dd>
                    </div>
                    <div style={fact}>
                      <dt style={factLabel}>Client ID</dt>
                      <dd style={{ ...factValue, fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {m.publicKeyHint ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  {result && (
                    <div style={result.ok ? okBox : errorBox}>
                      {result.ok ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
                      <span>{result.detail}</span>
                    </div>
                  )}

                  <div style={actions}>
                    <button
                      onClick={() => test(m)}
                      disabled={testing === m.provider || !m.hasCredentials}
                      style={{ ...btnSecondary, opacity: testing === m.provider || !m.hasCredentials ? 0.55 : 1 }}
                    >
                      <PlugZap size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                      {testing === m.provider ? "Testing..." : "Test connection"}
                    </button>
                    <button
                      onClick={() => toggle(m)}
                      disabled={saving === m.provider || (!m.isEnabled && !canEnable)}
                      style={{
                        ...(m.isEnabled ? btnSecondary : btnPrimary),
                        opacity: saving === m.provider || (!m.isEnabled && !canEnable) ? 0.55 : 1,
                      }}
                    >
                      {saving === m.provider
                        ? "Saving..."
                        : m.isEnabled
                          ? "Turn off"
                          : "Turn on"}
                    </button>
                  </div>

                  {!m.hasCredentials && (
                    <p style={hint}>
                      Add <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_CLIENT_SECRET</code> to
                      the API server environment, then restart it.
                    </p>
                  )}
                </>
              ) : (
                <p style={hint}>
                  Card payments through BAC Credomatic are planned. PayPal already
                  accepts credit and debit cards from customers without a PayPal account.
                </p>
              )}
            </section>
          );
        })}
      </div>

      <section style={securityNote}>
        <ShieldCheck size={18} color="#1a6b4a" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.35rem" }}>
            Why credentials aren&apos;t edited here
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--brand-gray)", lineHeight: 1.6 }}>
            Payment secrets stay in the server environment and never reach the
            browser, so a leaked database backup or a compromised admin session
            can&apos;t expose them. To switch from sandbox to live, replace the
            PayPal variables on the server with your live credentials, set{" "}
            <code>PAYPAL_MODE=live</code>, and restart the API.
          </p>
        </div>
      </section>
    </div>
  );
}

// Styles
const header: React.CSSProperties = { marginBottom: "1.5rem" };
const subtitle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "var(--brand-gray)",
  marginTop: "0.35rem",
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "1rem",
  marginBottom: "1.25rem",
};
const card: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: "14px",
  padding: "1.5rem",
  border: "1px solid var(--border-strong)",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};
const cardHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
};
const facts: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.55rem",
  margin: 0,
  paddingTop: "0.9rem",
  borderTop: "1px solid var(--border-soft)",
};
const fact: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
};
const factLabel: React.CSSProperties = {
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--brand-gray)",
  fontWeight: 600,
};
const factValue: React.CSSProperties = { margin: 0, fontSize: "0.85rem", textAlign: "right" };
const actions: React.CSSProperties = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };
const hint: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "var(--brand-gray)",
  lineHeight: 1.55,
  margin: 0,
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
const muted: React.CSSProperties = {
  padding: "2rem",
  color: "var(--brand-gray)",
  fontSize: "0.875rem",
};
const boxBase: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "flex-start",
  borderRadius: "10px",
  padding: "0.7rem 0.9rem",
  fontSize: "0.85rem",
  lineHeight: 1.5,
};
const errorBox: React.CSSProperties = {
  ...boxBase,
  background: "#fff0f0",
  color: "#c0392b",
  border: "1px solid #f5d2d2",
  marginBottom: "0.25rem",
};
const okBox: React.CSSProperties = {
  ...boxBase,
  background: "#f0faf5",
  color: "#1a6b4a",
  border: "1px solid #cdeadd",
};
const warnBox: React.CSSProperties = {
  ...boxBase,
  background: "#fff4e5",
  color: "#8a4b00",
  border: "1px solid #f3d7ab",
  marginBottom: "1rem",
};
const infoBox: React.CSSProperties = {
  ...boxBase,
  background: "#eef5ff",
  color: "#1d4a86",
  border: "1px solid #cfe0f7",
  marginBottom: "1rem",
};
const securityNote: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  background: "var(--surface)",
  border: "1px solid var(--border-soft)",
  borderRadius: "12px",
  padding: "1rem 1.25rem",
};
const pill = (kind: "on" | "off" | "soon" | "live" | "sandbox"): React.CSSProperties => {
  const map = {
    on: { bg: "#f0faf5", fg: "#1a6b4a" },
    off: { bg: "#f3f1ec", fg: "#6b7b74" },
    soon: { bg: "#f3f1ec", fg: "#6b7b74" },
    live: { bg: "#fff0f0", fg: "#b3261e" },
    sandbox: { bg: "#eef5ff", fg: "#1d4a86" },
  }[kind];
  return {
    background: map.bg,
    color: map.fg,
    padding: "3px 10px",
    borderRadius: "100px",
    fontSize: "0.72rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
  };
};
