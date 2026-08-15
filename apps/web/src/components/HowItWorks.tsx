"use client";

import { motion, useReducedMotion } from "motion/react";
import { MapPinned, CalendarClock, ShieldCheck, Car } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: MapPinned,
    title: "Choose Your Route",
    desc: "Select origin, destination, date and number of passengers.",
  },
  {
    num: "02",
    icon: CalendarClock,
    title: "Pick a Departure",
    desc: "Join a fixed shared schedule, or set any pickup time for a private transfer.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Pay Securely",
    desc: "Complete your booking with our secure payment system.",
  },
  {
    num: "04",
    icon: Car,
    title: "We Pick You Up",
    desc: "Your driver arrives at your hotel or address on time.",
  },
];

export default function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" style={{ background: "#fff", padding: "5.5rem 2rem" }}>
      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "clamp(1.9rem, 3.5vw, 2.5rem)",
              fontWeight: 600,
              color: "var(--brand-dark)",
              marginBottom: "0.6rem",
            }}
          >
            How It Works
          </h2>
          <p
            style={{
              color: "var(--brand-gray)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "1rem",
            }}
          >
            Book your transfer in under 2 minutes
          </p>
        </div>

        <div style={{ position: "relative" }}>
          {/* Riel que conecta los pasos: solo tiene sentido en la fila horizontal */}
          <div className="hiw-rail" aria-hidden="true" style={railStyle} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "2.5rem",
              position: "relative",
            }}
          >
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.num}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{ textAlign: "center" }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      margin: "0 auto 1rem",
                      borderRadius: "50%",
                      background: "var(--brand-green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      position: "relative",
                      zIndex: 1,
                      boxShadow: "0 0 0 6px #fff",
                    }}
                  >
                    <Icon size={24} strokeWidth={1.75} />
                  </div>

                  <div
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "var(--brand-gold)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {s.num}
                  </div>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 500,
                      marginBottom: "0.5rem",
                      color: "var(--brand-dark)",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--brand-gray)",
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    {s.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .hiw-rail { display: none; }
        }
      `}</style>
    </section>
  );
}

const railStyle: React.CSSProperties = {
  position: "absolute",
  top: "28px",
  left: "12.5%",
  right: "12.5%",
  height: "2px",
  background:
    "linear-gradient(to right, transparent, #e0ddd6 8%, #e0ddd6 92%, transparent)",
  zIndex: 0,
};
