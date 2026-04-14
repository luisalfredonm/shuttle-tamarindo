import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES_DATA } from "@/lib/routes-data";

export const metadata: Metadata = {
  title: "All Shuttle Routes in Guanacaste, Costa Rica",
  description:
    "Browse all available shuttle routes from Tamarindo. Daily departures to Liberia Airport, Arenal, Monteverde, San José and more. Guaranteed service.",
};

export default function RoutesIndexPage() {
  return (
    <main
      style={{
        paddingTop: "68px",
        minHeight: "100vh",
        background: "var(--brand-cream)",
      }}
    >
      <section
        style={{
          background:
            "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-green) 100%)",
          padding: "4rem 2rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            marginBottom: "0.75rem",
          }}
        >
          All Shuttle Routes
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "1rem",
          }}
        >
          Guaranteed daily departures across Guanacaste and Costa Rica
        </p>
      </section>

      <section
        style={{ padding: "3rem 2rem", maxWidth: "1000px", margin: "0 auto" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {ROUTES_DATA.map((route) => (
            <Link
              key={route.slug}
              href={"/routes/" + route.slug}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "1.75rem",
                  border: "1px solid #e8e4dc",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--brand-gray)",
                        fontFamily: "DM Sans, sans-serif",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "3px",
                      }}
                    >
                      FROM
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.95rem",
                      }}
                    >
                      {route.origin}
                    </div>
                  </div>
                  <span
                    style={{ color: "var(--brand-gold)", fontSize: "1.2rem" }}
                  >
                    →
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--brand-gray)",
                        fontFamily: "DM Sans, sans-serif",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "3px",
                      }}
                    >
                      TO
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.95rem",
                      }}
                    >
                      {route.destination}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "1rem",
                    borderTop: "1px solid #f0ece4",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "0.8rem",
                      color: "var(--brand-gray)",
                    }}
                  >
                    {Math.floor(route.durationMin / 60)}h
                    {route.durationMin % 60 > 0
                      ? ` ${route.durationMin % 60}m`
                      : ""}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "3px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--brand-gray)",
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      from
                    </span>
                    <span
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "var(--brand-green)",
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      ${route.priceShared}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--brand-gray)",
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      /person
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
