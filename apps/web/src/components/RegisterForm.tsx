"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(name, email, password, phone);
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
          Create account
        </h1>
        <p
          style={{
            color: "var(--brand-gray)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.95rem",
          }}
        >
          Book and manage your transfers easily
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
            <label style={labelStyle}>Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
              style={inputStyle}
            />
          </div>

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
            <label style={labelStyle}>
              Phone number{" "}
              <span
                style={{
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (optional)
              </span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+506 8888 8888"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--brand-gray)",
              fontFamily: "DM Sans, sans-serif",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            By creating an account you agree to our{" "}
            <Link
              href="/terms"
              style={{ color: "var(--brand-green)", textDecoration: "none" }}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              style={{ color: "var(--brand-green)", textDecoration: "none" }}
            >
              Privacy Policy
            </Link>
          </p>
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
        Already have an account?{" "}
        <Link
          href="/login"
          style={{
            color: "var(--brand-green)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Sign in
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
  marginBottom: "6px",
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
