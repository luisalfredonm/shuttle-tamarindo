"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function ProfileForm() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgPw, setMsgPw] = useState("");
  const [error, setError] = useState("");
  const [errorPw, setErrorPw] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    setForm({ name: user.name, phone: user.phone || "" });
  }, [user, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(""); setMsg("");
    try {
      const token = localStorage.getItem("shuttle_token");
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error saving");
      updateUser(data);
      setMsg("Profile updated successfully.");
    } catch (err: any) {
      setError(err.message || "Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setErrorPw("Passwords do not match"); return; }
    if (pwForm.next.length < 6) { setErrorPw("Password must be at least 6 characters"); return; }
    setSavingPw(true);
    setErrorPw(""); setMsgPw("");
    try {
      const token = localStorage.getItem("shuttle_token");
      const res = await fetch(`${API_URL}/auth/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error changing password");
      setMsgPw("Password changed successfully.");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      setErrorPw(err.message || "Error changing password");
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "6rem 2rem 2.5rem" }}>
      <Link href="/account" style={{ color: "var(--brand-green)", fontFamily: "DM Sans, sans-serif", fontSize: "0.9rem", textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
        ← My Bookings
      </Link>

      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>My Profile</h1>
      <p style={{ color: "var(--brand-gray)", fontFamily: "DM Sans, sans-serif", fontSize: "0.9rem", marginBottom: "2rem" }}>{user.email}</p>

      {/* Profile info */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e4dc", padding: "1.75rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", fontFamily: "DM Sans, sans-serif" }}>Personal Info</h2>
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={user.email} disabled style={{ ...inputStyle, background: "#f5f4f0", color: "var(--brand-gray)" }} />
          </div>
          <div>
            <label style={labelStyle}>Phone / WhatsApp</label>
            <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+506 8888 8888" style={inputStyle} />
          </div>
          {error && <p style={{ color: "#c0392b", fontSize: "0.8rem", margin: 0 }}>{error}</p>}
          {msg && <p style={{ color: "#1a6b4a", fontSize: "0.8rem", margin: 0 }}>{msg}</p>}
          <button type="submit" disabled={saving} style={btnGreen}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e4dc", padding: "1.75rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", fontFamily: "DM Sans, sans-serif" }}>Change Password</h2>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { label: "Current password", key: "current" },
            { label: "New password", key: "next" },
            { label: "Confirm new password", key: "confirm" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input type="password" value={pwForm[key as keyof typeof pwForm]} onChange={(e) => setPwForm(f => ({ ...f, [key]: e.target.value }))} required style={inputStyle} />
            </div>
          ))}
          {errorPw && <p style={{ color: "#c0392b", fontSize: "0.8rem", margin: 0 }}>{errorPw}</p>}
          {msgPw && <p style={{ color: "#1a6b4a", fontSize: "0.8rem", margin: 0 }}>{msgPw}</p>}
          <button type="submit" disabled={savingPw} style={btnGreen}>
            {savingPw ? "Saving..." : "Change password"}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #ffc5c5", padding: "1.75rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", fontFamily: "DM Sans, sans-serif", color: "#c0392b" }}>Sign out</h2>
        <p style={{ color: "var(--brand-gray)", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", marginBottom: "1rem" }}>
          You will be redirected to the home page.
        </p>
        <button onClick={() => { logout(); router.push("/"); }} style={{ background: "none", border: "1px solid #ffc5c5", borderRadius: "8px", padding: "9px 20px", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", color: "#c0392b" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--brand-gray)", fontFamily: "DM Sans, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid #e0ddd6", fontSize: "0.95rem", fontFamily: "DM Sans, sans-serif", boxSizing: "border-box" };
const btnGreen: React.CSSProperties = { background: "var(--brand-green)", color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "0.9rem", fontFamily: "DM Sans, sans-serif", fontWeight: 500, cursor: "pointer", alignSelf: "flex-start" };
