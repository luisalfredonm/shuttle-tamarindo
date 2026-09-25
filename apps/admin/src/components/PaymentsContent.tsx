"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, CreditCard, PlugZap, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PageHeader from "./ui/PageHeader";
import Switch from "./ui/Switch";
import Toast from "./ui/Toast";
import ui from "./ui/ui.module.css";

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
  const clearError = useCallback(() => setError(""), []);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not update ${m.label}`);
    } finally {
      setSaving(null);
    }
  };

  const test = async (m: Method) => {
    setTesting(m.provider);
    try {
      const result = await apiFetch(`/payments/config/${m.provider}/verify`, { method: "POST" });
      setTests((prev) => ({ ...prev, [m.provider]: result }));
    } catch (err) {
      setTests((prev) => ({
        ...prev,
        [m.provider]: { ok: false, detail: err instanceof Error ? err.message : "Connection test failed" },
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
      <PageHeader title="Payments" subtitle="Choose which payment methods customers can use at checkout." />

      {!loading && !anyEnabled && (
        <div className={`${ui.notice} ${ui.noticeWarn}`}>
          <CircleAlert size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>No payment method is on.</strong> Customers can book but cannot pay. Turn on a method below to start
            taking payments.
          </span>
        </div>
      )}

      {!loading && anySandboxOn && !anyLive && (
        <div className={`${ui.notice} ${ui.noticeInfo}`}>
          <CircleAlert size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>Test mode.</strong> Payments go through the PayPal sandbox and no real money moves. Switch to live
            credentials on the server before launch.
          </span>
        </div>
      )}

      {loading && <div className={ui.skeleton} style={{ height: 260 }} aria-hidden="true" />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "0.85rem", marginBottom: "1rem" }}>
        {methods.map((m) => {
          const result = tests[m.provider];
          const canEnable = m.isSupported && m.hasCredentials;

          return (
            <section key={m.provider} className={ui.card} style={{ display: "flex", flexDirection: "column" }}>
              <div className={ui.cardPad} style={{ display: "flex", flexDirection: "column", gap: "0.9rem", flex: 1 }}>
                <div className={ui.cardHead}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <span style={{ width: 38, height: 38, borderRadius: 10, background: "#fbf3e3", color: "var(--brand-gold)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <CreditCard size={19} />
                    </span>
                    <h2 className={ui.cardTitle}>{m.label}</h2>
                  </div>
                  {!m.isSupported ? (
                    <span className={`${ui.pill} ${ui.pillGray}`}>Coming soon</span>
                  ) : m.mode ? (
                    <span className={`${ui.pill} ${m.mode === "live" ? ui.pillGreen : ui.pillBlue}`}>
                      {m.mode === "live" ? "Live" : "Sandbox"}
                    </span>
                  ) : null}
                </div>

                {m.isSupported ? (
                  <>
                    <dl className={ui.facts}>
                      <div className={ui.fact}>
                        <dt>Credentials</dt>
                        <dd style={{ color: m.hasCredentials ? "#1a6b4a" : "#c0392b" }}>
                          {m.hasCredentials ? "Loaded on the server" : "Missing on the server"}
                        </dd>
                      </div>
                      <div className={ui.fact}>
                        <dt>Client ID</dt>
                        <dd className={ui.mono} style={{ fontSize: "0.8rem" }}>{m.publicKeyHint ?? "—"}</dd>
                      </div>
                    </dl>

                    {result && (
                      <div className={`${ui.notice} ${result.ok ? ui.noticeOk : ui.noticeError}`} style={{ margin: 0 }}>
                        {result.ok ? <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} /> : <CircleAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />}
                        <span>{result.detail}</span>
                      </div>
                    )}

                    {!m.hasCredentials && (
                      <p className={ui.hint} style={{ margin: 0 }}>
                        Add <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_CLIENT_SECRET</code> to the API server
                        environment, then restart it.
                      </p>
                    )}
                  </>
                ) : (
                  <p className={ui.hint} style={{ margin: 0 }}>
                    Card payments through BAC Credomatic are planned. PayPal already accepts credit and debit cards from
                    customers without a PayPal account.
                  </p>
                )}
              </div>

              {m.isSupported && (
                <div className={ui.cardFooter} style={{ flexWrap: "wrap" }}>
                  <div style={{ marginRight: "auto" }}>
                    <Switch
                      checked={m.isEnabled}
                      disabled={saving === m.provider || (!m.isEnabled && !canEnable)}
                      onChange={() => toggle(m)}
                      label={saving === m.provider ? "Saving..." : m.isEnabled ? "Accepting payments" : "Turned off"}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => test(m)}
                    disabled={testing === m.provider || !m.hasCredentials}
                    className={`${ui.btn} ${ui.secondary} ${ui.small}`}
                  >
                    <PlugZap size={15} className={testing === m.provider ? "spin" : undefined} />
                    {testing === m.provider ? "Testing..." : "Test connection"}
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Explicación para quien lo pregunte: plegada, que en el teléfono ocupaba media pantalla */}
      <details className={`${ui.card} ${ui.cardPad}`} style={{ boxShadow: "none" }}>
        <summary style={{ display: "flex", alignItems: "center", gap: "0.6rem", minHeight: 28, cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}>
          <ShieldCheck size={18} color="#1a6b4a" style={{ flexShrink: 0 }} />
          Why credentials aren&apos;t edited here
        </summary>
        <p style={{ fontSize: "0.84rem", color: "var(--text-3)", lineHeight: 1.6, marginTop: "0.6rem" }}>
          Payment secrets stay in the server environment and never reach the browser, so a leaked database backup or a
          compromised admin session can&apos;t expose them. To switch from sandbox to live, replace the PayPal variables on
          the server with your live credentials, set <code>PAYPAL_MODE=live</code>, and restart the API.
        </p>
      </details>

      {error && <Toast message={error} tone="error" onClose={clearError} />}
    </div>
  );
}
