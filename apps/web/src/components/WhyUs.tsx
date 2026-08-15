"use client";

import { motion, useReducedMotion } from "motion/react";
import { ShieldCheck, Timer, Receipt, Snowflake } from "lucide-react";

const FEATURES = [
  {
    icon: Timer,
    title: "Always On Time",
    desc: "Professional drivers tracking your flight. We wait for you.",
  },
  {
    icon: Receipt,
    title: "Transparent Pricing",
    desc: "No hidden fees. The price you see is the price you pay.",
  },
  {
    icon: Snowflake,
    title: "Air Conditioned",
    desc: "Modern, comfortable vehicles with A/C for every journey.",
  },
];

export default function WhyUs() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="why-us" style={{ background: "var(--brand-dark)", padding: "5.5rem 2rem" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "clamp(1.9rem, 3.5vw, 2.5rem)",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "0.6rem",
            }}
          >
            Why Choose Us
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "1rem",
            }}
          >
            The most reliable shuttle service in Guanacaste
          </p>
        </div>

        <div style={{ display: "grid", gap: "1.25rem" }}>
          {/* Diferenciador principal, en banner ancho: es el mismo dato del
              stat "100%" del Hero, aca se explica por que importa */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "20px",
              border: "1px solid rgba(201,151,58,0.25)",
              background:
                "radial-gradient(120% 140% at 0% 0%, rgba(201,151,58,0.16) 0%, rgba(255,255,255,0.04) 55%)",
              padding: "clamp(1.75rem, 4vw, 2.75rem)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "2rem",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                flexShrink: 0,
                borderRadius: "16px",
                background: "rgba(201,151,58,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--brand-gold)",
              }}
            >
              <ShieldCheck size={30} strokeWidth={1.75} />
            </div>

            <div style={{ flex: "1 1 260px" }}>
              <h3
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "0.4rem",
                }}
              >
                Guaranteed Departures
              </h3>
              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.95rem",
                  lineHeight: 1.65,
                  maxWidth: "56ch",
                }}
              >
                Your trip runs no matter what. No minimum passengers
                required, ever. Once a shared departure is scheduled, it
                leaves.
              </p>
            </div>

            <div
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                fontWeight: 700,
                color: "var(--brand-gold)",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              100%
            </div>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    padding: "2rem",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--brand-gold)",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <h3
                    style={{
                      color: "#fff",
                      fontSize: "1.05rem",
                      marginBottom: "0.5rem",
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    {f.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
