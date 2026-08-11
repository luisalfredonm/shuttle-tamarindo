import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE = "/hero-shuttle-tamarindo-sunset.jpg";

/**
 * Degradado que aproxima los tonos del atardecer de la foto. Se muestra
 * mientras la imagen carga para evitar el flash blanco sobre texto claro.
 */
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%237b5a86'/%3E%3Cstop offset='0.45' stop-color='%23e2894f'/%3E%3Cstop offset='0.78' stop-color='%23a8734b'/%3E%3Cstop offset='1' stop-color='%232b2119'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='12' height='8' fill='url(%23g)'/%3E%3C/svg%3E";

const STATS = [
  { num: "100%", label: "Guaranteed departures" },
  { num: "6+", label: "Daily routes" },
  { num: "24/7", label: "Support" },
];

export default function Hero() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        paddingTop: "68px",
        overflow: "hidden",
        // Se ve durante la carga y si la foto llegara a faltar
        background: "var(--brand-dark)",
        isolation: "isolate",
      }}
    >
      <Image
        src={HERO_IMAGE}
        alt="Retana Services Tamarindo passenger van parked on the black sand of a Guanacaste beach at sunset, palm trees and the Pacific behind it"
        fill
        // Es el elemento LCP de la home: se precarga desde el <head>.
        // En Next 16 `priority` quedó deprecado en favor de `preload`.
        preload
        // Sin `quality`: en Next 16 el default de `qualities` es [75] y
        // cualquier otro valor lo rechaza el optimizador con 400
        sizes="100vw"
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        style={{
          objectFit: "cover",
          // Favorece la van y la arena; en pantallas altas evita
          // que el recorte se coma el vehículo
          objectPosition: "center 55%",
          zIndex: -2,
        }}
      />

      {/* Cama de contraste para el texto: densa abajo, sobre la arena oscura,
          y transparente arriba para no apagar el cielo */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background:
            "linear-gradient(to top, rgba(13,31,23,0.94) 0%, rgba(13,31,23,0.82) 20%, rgba(13,31,23,0.42) 45%, rgba(13,31,23,0.10) 68%, rgba(13,31,23,0) 100%)",
        }}
      />
      {/* Refuerzo lateral: sostiene el texto cuando el sol cae a la izquierda */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background:
            "linear-gradient(to right, rgba(13,31,23,0.55) 0%, rgba(13,31,23,0.15) 45%, rgba(13,31,23,0) 70%)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 clamp(1.25rem, 5vw, 4rem) clamp(2rem, 5vw, 3.5rem)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: "rgba(201,151,58,0.15)",
            border: "1px solid rgba(201,151,58,0.45)",
            backdropFilter: "blur(6px)",
            color: "var(--brand-gold)",
            padding: "6px 18px",
            borderRadius: "100px",
            fontSize: "0.75rem",
            fontFamily: "DM Sans, sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Guaranteed departures · No minimum passengers
        </span>

        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(2.6rem, 7vw, 5rem)",
            color: "#fff",
            lineHeight: 1.05,
            fontWeight: 600,
            margin: "1.5rem 0 1.25rem",
            maxWidth: "16ch",
            textShadow: "0 2px 24px rgba(0,0,0,0.35)",
          }}
        >
          Your ride awaits
          <br />
          <span style={{ color: "var(--brand-gold)" }}>in Guanacaste</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 1.6vw, 1.15rem)",
            color: "rgba(255,255,255,0.82)",
            maxWidth: "48ch",
            lineHeight: 1.7,
            fontWeight: 300,
            marginBottom: "2.25rem",
          }}
        >
          Shared shuttles and private transfers from Tamarindo to Liberia
          Airport and every major destination. Always on time, always
          guaranteed.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="#book" className="hero-cta" style={ctaPrimary}>
            Book your transfer
          </Link>
          <Link href="#routes" className="hero-cta" style={ctaSecondary}>
            View routes
          </Link>
        </div>

        <dl
          style={{
            display: "flex",
            gap: "clamp(1.5rem, 5vw, 4rem)",
            flexWrap: "wrap",
            marginTop: "clamp(2.5rem, 5vw, 3.5rem)",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          {STATS.map((s) => (
            // Flex column + order: en un <dl> el <dt> debe preceder al <dd>
            // en el DOM, pero visualmente queremos el número arriba
            <div
              key={s.label}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <dt
                style={{
                  order: 2,
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "DM Sans, sans-serif",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </dt>
              <dd
                style={{
                  order: 1,
                  fontFamily: "Playfair Display, serif",
                  fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                  fontWeight: 600,
                  color: "var(--brand-gold)",
                  lineHeight: 1.1,
                  marginBottom: "2px",
                }}
              >
                {s.num}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const ctaBase: React.CSSProperties = {
  padding: "14px 32px",
  borderRadius: "var(--radius)",
  fontWeight: 500,
  fontSize: "1rem",
  textDecoration: "none",
  fontFamily: "DM Sans, sans-serif",
};

const ctaPrimary: React.CSSProperties = {
  ...ctaBase,
  background: "var(--brand-gold)",
  color: "var(--brand-dark)",
};

const ctaSecondary: React.CSSProperties = {
  ...ctaBase,
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.28)",
  backdropFilter: "blur(6px)",
};
