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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "2.5rem", width: "100%", maxWidth: "360px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e8e4dc" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--brand-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, color: "var(--brand-dark)" }}>S</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Shuttle Tamarindo</div>
            <div style={{ fontSize: "0.75rem", color: "var(--brand-gray)" }}>Admin Panel</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>Password</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e0dbd0", fontSize: "0.875rem", boxSizing: "border-box" }}
            />
          </div>
          {error && <p style={{ color: "#c0392b", fontSize: "0.8rem", margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--brand-gold)", color: "var(--brand-dark)", border: "none", borderRadius: "8px", padding: "10px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
