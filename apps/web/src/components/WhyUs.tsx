import Reveal from "@/components/Reveal";
import { HeartHandshake, Timer, Receipt, Waves } from "lucide-react";
import { BRAND_FOUNDED } from "@/lib/brand";

// Solo lo que el negocio respalda: sin reseñas todavía, no se promete
// "el más confiable" ni se muestran estrellas
const FEATURES = [
  {
    icon: Timer,
    title: "Flight tracking",
    desc: "If your flight is late, we wait, at no extra cost.",
  },
  {
    icon: Receipt,
    title: "Fixed prices, no surprises",
    desc: "The price you see is the price you pay.",
  },
  {
    icon: Waves,
    title: "Surfboards travel free",
    desc: "Bring your board and extra luggage at no extra charge.",
  },
];

export default function WhyUs() {

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
            Why travel with Retana Services
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "1rem",
            }}
          >
            A local family business, not a booking platform
          </p>
        </div>

        <div style={{ display: "grid", gap: "1.25rem" }}>
          {/* Diferenciador principal, en banner ancho: la historia de la
              familia, que es lo que ninguna plataforma de reservas tiene */}
          <Reveal amount={0.4}
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
              <HeartHandshake size={30} strokeWidth={1.75} />
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
                Family-run since {BRAND_FOUNDED}
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
                Two siblings built this company ride by ride, and we still look
                after every booking ourselves.
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
              {BRAND_FOUNDED}
            </div>
          </Reveal>

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
                <Reveal key={f.title} amount={0.4} delay={i * 0.08} duration={0.5}
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
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
