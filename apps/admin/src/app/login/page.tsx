"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Invalid password");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
    }}>
      <div style={{
        background: "var(--surface)",
        borderRadius: "20px",
        padding: "2.5rem",
        width: "100%",
        maxWidth: "380px",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "2rem" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "var(--brand-green)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", fontWeight: 700, color: "#fff",
            boxShadow: "0 2px 8px rgba(26,107,74,0.35)",
          }}>S</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>Shuttle Tamarindo</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: "1px" }}>Admin Panel</div>
          </div>
        </div>

        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--text)" }}>Welcome back</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-3)", marginBottom: "1.75rem" }}>Enter your password to continue</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Password
            </label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div style={{ background: "#FEF0F0", border: "1px solid #FCCACA", borderRadius: "8px", padding: "10px 12px", color: "#C0392B", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ padding: "11px", fontSize: "0.9rem", opacity: loading ? 0.7 : 1, marginTop: "4px" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
