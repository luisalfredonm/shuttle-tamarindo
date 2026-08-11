"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RouteData } from "@/lib/routes-data";

interface Props {
  route: RouteData;
}

export default function RouteDetail({ route }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState("");
  const [passengers, setPass] = useState("1");
  const [type, setType] = useState<"SHARED" | "PRIVATE">("SHARED");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    router.push(
      `/book?route=${route.slug}&date=${date}&passengers=${passengers}&type=${type}`,
    );
  }

  const price = type === "SHARED" ? route.priceShared : route.pricePrivate;

  return (
    <>
      {/* Schema markup para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: `${route.origin} to ${route.destination} Shuttle`,
            description: route.metaDescription,
            provider: {
              "@type": "Organization",
              name: "Retana Services Tamarindo",
            },
            offers: {
              "@type": "Offer",
              price: route.priceShared,
              priceCurrency: "USD",
            },
            areaServed: "Costa Rica",
          }),
        }}
      />

      <main style={{ paddingTop: "68px" }}>
        {/* Hero */}
        <section
          style={{
            background:
              "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-green) 100%)",
            padding: "5rem 2rem 4rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <Link
              href="/"
              style={{
                color: "rgba(255,255,255,0.55)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.85rem",
                textDecoration: "none",
                display: "inline-block",
                marginBottom: "1.5rem",
              }}
            >
              ← All routes
            </Link>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  background: "rgba(201,151,58,0.15)",
                  border: "1px solid rgba(201,151,58,0.4)",
                  color: "var(--brand-gold)",
                  padding: "5px 14px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  fontFamily: "DM Sans, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Shared from ${route.priceShared}/person
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: "#fff",
                lineHeight: 1.1,
                marginBottom: "1rem",
              }}
            >
              {route.origin} to
              <br />
              <span style={{ color: "var(--brand-gold)" }}>
                {route.destination}
              </span>
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "1rem",
                marginBottom: "2rem",
                lineHeight: 1.7,
              }}
            >
              {Math.floor(route.durationMin / 60)}h
              {route.durationMin % 60 > 0 ? ` ${route.durationMin % 60}m` : ""}{" "}
              · {route.distanceKm} km · Departures at{" "}
              {route.departureHours.join(", ")}
            </p>

            {/* Stats row */}
            <div
              style={{
                display: "flex",
                gap: "2.5rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "Shared price", value: `$${route.priceShared}` },
                { label: "Private price", value: `$${route.pricePrivate}` },
                {
                  label: "Daily departures",
                  value: `${route.departureHours.length}`,
                },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 700,
                      color: "var(--brand-gold)",
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: "DM Sans, sans-serif",
                      marginTop: "2px",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking form */}
        <section
          style={{
            background: "#fff",
            padding: "3rem 2rem",
            borderBottom: "1px solid #e8e4dc",
          }}
        >
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              Book This Route
            </h2>

            {/* Type toggle */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "1.5rem",
              }}
            >
              {(["SHARED", "PRIVATE"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: "9px 24px",
                    border: "1px solid var(--brand-green)",
                    background:
                      type === t ? "var(--brand-green)" : "transparent",
                    color: type === t ? "#fff" : "var(--brand-green)",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "0.9rem",
                    borderRadius:
                      t === "SHARED" ? "8px 0 0 8px" : "0 8px 8px 0",
                    fontWeight: 500,
                  }}
                >
                  {t === "SHARED"
                    ? `Shared — $${route.priceShared}/person`
                    : `Private — $${route.pricePrivate}`}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSearch}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                alignItems: "end",
              }}
            >
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              {type === "SHARED" && (
                <div>
                  <label style={labelStyle}>Passengers</label>
                  <select
                    value={passengers}
                    onChange={(e) => setPass(e.target.value)}
                    style={inputStyle}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "passenger" : "passengers"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>Total</label>
                <div
                  style={{
                    ...inputStyle,
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 700,
                    color: "var(--brand-green)",
                    fontSize: "1.2rem",
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  $
                  {type === "SHARED"
                    ? route.priceShared * parseInt(passengers)
                    : route.pricePrivate}{" "}
                  USD
                </div>
              </div>

              <button
                type="submit"
                style={{
                  background: "var(--brand-green)",
                  color: "#fff",
                  padding: "0 24px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 500,
                  height: "50px",
                }}
              >
                See Available Trips
              </button>
            </form>
          </div>
        </section>

        {/* Content area */}
        <section
          style={{ background: "var(--brand-cream)", padding: "4rem 2rem" }}
        >
          <div
            style={{
              maxWidth: "860px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
            }}
          >
            {/* Highlights */}
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "2rem",
                border: "1px solid #e8e4dc",
              }}
            >
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1.25rem" }}>
                What's Included
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {route.highlights.map((h) => (
                  <li
                    key={h}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "0.9rem",
                      color: "var(--brand-dark)",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--brand-green)",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Departures */}
            <div
              style={{
                background: "var(--brand-dark)",
                borderRadius: "16px",
                padding: "2rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "1.25rem",
                  color: "#fff",
                }}
              >
                Daily Departures
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {route.departureHours.map((h) => (
                  <div
                    key={h}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {h}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--brand-gold)",
                        fontFamily: "DM Sans, sans-serif",
                        background: "rgba(201,151,58,0.15)",
                        padding: "3px 10px",
                        borderRadius: "100px",
                      }}
                    >
                      Guaranteed
                    </span>
                  </div>
                ))}
              </div>
              <p
                style={{
                  marginTop: "1rem",
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "DM Sans, sans-serif",
                  lineHeight: 1.5,
                }}
              >
                All departures are guaranteed regardless of passenger count.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ background: "#fff", padding: "4rem 2rem" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "1.8rem",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              Frequently Asked Questions
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {route.faqs.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* Nearby */}
        <section
          style={{ background: "var(--brand-cream)", padding: "3rem 2rem" }}
        >
          <div
            style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}
          >
            <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>
              Nearby Attractions at {route.destination.split("(")[0].trim()}
            </h3>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {route.nearbyAttractions.map((a) => (
                <span
                  key={a}
                  style={{
                    background: "#fff",
                    border: "1px solid #e8e4dc",
                    borderRadius: "100px",
                    padding: "8px 16px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "0.875rem",
                    color: "var(--brand-dark)",
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section
          style={{
            background: "var(--brand-green)",
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <h2
            style={{ color: "#fff", fontSize: "2rem", marginBottom: "0.75rem" }}
          >
            Ready to travel?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontFamily: "DM Sans, sans-serif",
              marginBottom: "2rem",
              fontSize: "1rem",
            }}
          >
            Book your {route.origin} to {route.destination} transfer today.
          </p>
          <Link
            href={"/#book"}
            style={{
              background: "#fff",
              color: "var(--brand-green)",
              padding: "14px 32px",
              borderRadius: "10px",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Book Now — from ${route.priceShared}/person
          </Link>
        </section>
      </main>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: "1px solid #e8e4dc",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "1.1rem 1.25rem",
          background: open ? "var(--brand-cream)" : "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <span
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            fontSize: "0.95rem",
            color: "var(--brand-dark)",
          }}
        >
          {q}
        </span>
        <span
          style={{
            color: "var(--brand-green)",
            fontSize: "1.2rem",
            flexShrink: 0,
            transform: open ? "rotate(45deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: "0 1.25rem 1.1rem",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.9rem",
            color: "var(--brand-gray)",
            lineHeight: 1.7,
            background: "var(--brand-cream)",
          }}
        >
          {a}
        </div>
      )}
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
  height: "50px",
  outline: "none",
};
