"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Clock } from "lucide-react";
import { ROUTES_DATA, RouteData } from "@/lib/routes-data";

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  const hasFraction = hours % 1 !== 0;
  return `${hasFraction ? hours.toFixed(1) : hours} hrs`;
};

export default function Routes() {
  const reduceMotion = useReducedMotion();
  const [featured, ...rest] = ROUTES_DATA;

  return (
    <section id="routes" style={{ background: "var(--brand-cream)", padding: "5.5rem 2rem" }}>
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "clamp(1.9rem, 3.5vw, 2.5rem)",
              fontWeight: 600,
              color: "var(--brand-dark)",
              marginBottom: "0.6rem",
            }}
          >
            Popular Routes
          </h2>
          <p
            style={{
              color: "var(--brand-gray)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "1rem",
              maxWidth: "46ch",
              margin: "0 auto",
            }}
          >
            Shared shuttles run on a fixed daily schedule. Private transfers
            leave whenever you do.
          </p>
        </div>

        {/* Ruta insignia en formato ancho, el resto en grilla de fotos */}
        <FeaturedRouteCard route={featured} reduceMotion={!!reduceMotion} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
            marginTop: "1.25rem",
          }}
        >
          {rest.map((r, i) => (
            <RouteCard key={r.slug} route={r} index={i} reduceMotion={!!reduceMotion} />
          ))}
        </div>
      </div>

      <style>{`
        .rt-card { display: block; }
        .rt-img { transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .rt-arrow { transition: transform 0.25s ease; }
        .rt-card:hover .rt-img { transform: scale(1.06); }
        .rt-card:hover .rt-arrow { transform: translate(3px, -3px); }
      `}</style>
    </section>
  );
}

function FeaturedRouteCard({
  route: r,
  reduceMotion,
}: {
  route: RouteData;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={"/routes/" + r.slug} style={{ textDecoration: "none" }} className="rt-card">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            background: "#fff",
            borderRadius: "22px",
            overflow: "hidden",
            border: "1px solid #e8e4dc",
          }}
          className="rt-featured"
        >
          <div style={{ position: "relative", minHeight: "260px", overflow: "hidden" }}>
            <Image
              src={r.heroImage}
              alt={`${r.origin} to ${r.destination} shuttle route`}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
              className="rt-img"
            />
          </div>

          <div
            style={{
              padding: "clamp(1.5rem, 3vw, 2.5rem)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--brand-gold)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.72rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.75rem",
              }}
            >
              Most booked
            </span>
            <h3
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(1.3rem, 2.2vw, 1.7rem)",
                fontWeight: 600,
                color: "var(--brand-dark)",
                marginBottom: "0.5rem",
                lineHeight: 1.25,
              }}
            >
              {r.origin} <span style={{ color: "var(--brand-gold)" }}>&rarr;</span> {r.destination}
            </h3>
            <p
              style={{
                color: "var(--brand-gray)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              Door to door service with flight tracking included on every
              airport run.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "var(--brand-gray)",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                <Clock size={15} strokeWidth={2} />
                {formatDuration(r.durationMin)}
              </span>

              <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--brand-gray)", fontFamily: "DM Sans, sans-serif" }}>
                  from
                </span>
                <span
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    color: "var(--brand-green)",
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  ${r.priceShared}
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--brand-gray)", fontFamily: "DM Sans, sans-serif" }}>
                  /person
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <style>{`
        @media (max-width: 700px) {
          .rt-featured { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  );
}

function RouteCard({
  route: r,
  index,
  reduceMotion,
}: {
  route: RouteData;
  index: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={"/routes/" + r.slug} style={{ textDecoration: "none" }} className="rt-card">
        <div
          style={{
            position: "relative",
            borderRadius: "18px",
            overflow: "hidden",
            aspectRatio: "4 / 5",
          }}
        >
          <Image
            src={r.heroImage}
            alt={`${r.origin} to ${r.destination} shuttle route`}
            fill
            sizes="(max-width: 700px) 100vw, 33vw"
            style={{ objectFit: "cover" }}
            className="rt-img"
          />

          {/* Misma cama de contraste que el Hero: densa abajo, transparente arriba */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(13,31,23,0.92) 0%, rgba(13,31,23,0.55) 40%, rgba(13,31,23,0.05) 70%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "6px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "#fff",
                  lineHeight: 1.3,
                  maxWidth: "18ch",
                }}
              >
                {r.origin} &rarr; {r.destination}
              </h3>
              <ArrowUpRight
                size={18}
                strokeWidth={2}
                color="#fff"
                className="rt-arrow"
                style={{ flexShrink: 0 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.78rem",
                }}
              >
                {formatDuration(r.durationMin)}
              </span>
              <span
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "var(--brand-gold)",
                }}
              >
                ${r.priceShared}
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>
                  {" "}/person
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
