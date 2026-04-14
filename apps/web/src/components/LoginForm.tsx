"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "420px", width: "100%" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--brand-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              fontSize: "1.3rem",
              color: "#fff",
              fontWeight: 700,
              fontFamily: "Playfair Display, serif",
            }}
          >
            S
          </div>
        </Link>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>
          Welcome back
        </h1>
        <p
          style={{
            color: "var(--brand-gray)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.95rem",
          }}
        >
          Sign in to manage your bookings
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "2rem",
          border: "1px solid #e8e4dc",
        }}
      >
        {error && (
          <div
            style={{
              background: "#fff0f0",
              border: "1px solid #ffc5c5",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "1.25rem",
              color: "#c0392b",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
        >
          <div>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <label style={labelStyle}>Password</label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--brand-green)",
                  textDecoration: "none",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--brand-green)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
              fontSize: "1rem",
              opacity: loading ? 0.7 : 1,
              marginTop: "0.25rem",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: "1.25rem",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.9rem",
          color: "var(--brand-gray)",
        }}
      >
        Don't have an account?{" "}
        <Link
          href="/register"
          style={{
            color: "var(--brand-green)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 500,
  color: "var(--brand-gray)",
  marginBottom: "0px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: "DM Sans, sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1px solid #e0ddd6",
  fontSize: "0.95rem",
  fontFamily: "DM Sans, sans-serif",
  color: "var(--brand-dark)",
  background: "#fafaf8",
  outline: "none",
  boxSizing: "border-box",
};
