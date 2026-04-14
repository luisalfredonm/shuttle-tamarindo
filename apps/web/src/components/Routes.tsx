import Link from "next/link";
import { ROUTES_DATA } from "@/lib/routes-data";

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  const hasFraction = hours % 1 !== 0;
  return `${hasFraction ? hours.toFixed(1) : hours} hrs`;
};
export default function Routes() {
  return (
    <section
      id="routes"
      style={{
        background: "var(--brand-cream)",
        padding: "5rem 2rem",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "2.2rem",
            marginBottom: "0.5rem",
          }}
        >
          Popular Routes
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--brand-gray)",
            marginBottom: "3rem",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Daily departures at 9:00 AM · 2:00 PM · 6:00 PM
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {ROUTES_DATA.map((r) => (
            <Link
              key={r.slug}
              href={"/routes/" + r.slug}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "1.75rem",
                  border: "1px solid #e8e4dc",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--brand-gray)",
                        fontFamily: "DM Sans, sans-serif",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      FROM
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "1rem",
                        fontFamily: "DM Sans, sans-serif",
                        color: "var(--brand-dark)",
                      }}
                    >
                      {r.origin}
                    </div>
                  </div>

                  <div
                    style={{ color: "var(--brand-gold)", fontSize: "1.2rem" }}
                  >
                    →
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--brand-gray)",
                        fontFamily: "DM Sans, sans-serif",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      TO
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "1rem",
                        fontFamily: "DM Sans, sans-serif",
                        color: "var(--brand-dark)",
                      }}
                    >
                      {r.destination}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "1rem",
                    borderTop: "1px solid #f0ece4",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--brand-gray)",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    {formatDuration(r.durationMin)}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
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
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        color: "var(--brand-green)",
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      ${r.priceShared}
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
      </div>
    </section>
  );
}

