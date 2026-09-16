import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

/**
 * Envoltorio compartido de las páginas de contenido (about, contact, faq,
 * privacy, terms). Centraliza el layout —fondo crema, card blanca, back-link—
 * y los estilos de texto para que las cinco páginas no los dupliquen y no se
 * desincronicen. El título va en <h1> (uno por página, como pide el SEO).
 */
export default function ContentPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        paddingTop: "calc(68px + 2rem)",
        paddingBottom: "4rem",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 2rem" }}>
        <Link
          href="/"
          style={{
            color: "var(--brand-green)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.9rem",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "1.5rem",
          }}
        >
          ← Back to home
        </Link>

        <article
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "2.5rem",
            border: "1px solid #e8e4dc",
          }}
        >
          <p style={contentStyles.eyebrow}>{BRAND_NAME}</p>
          <h1 style={contentStyles.h1}>{title}</h1>
          {intro ? <p style={contentStyles.lead}>{intro}</p> : null}
          {children}
        </article>
      </div>
    </main>
  );
}

/** Estilos compartidos: se reexportan para el contenido de cada página. */
export const contentStyles: Record<string, React.CSSProperties> = {
  eyebrow: {
    fontSize: "0.7rem",
    color: "var(--brand-gold)",
    fontFamily: "DM Sans, sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: 600,
    margin: "0 0 2px",
  },
  h1: {
    fontSize: "1.6rem",
    margin: "0 0 1rem",
    color: "var(--brand-dark)",
  },
  lead: {
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.95rem",
    lineHeight: 1.7,
    color: "var(--brand-gray)",
    margin: "0 0 1.25rem",
  },
  h2: {
    fontSize: "1.05rem",
    margin: "1.5rem 0 0.5rem",
    color: "var(--brand-dark)",
  },
  p: {
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.88rem",
    lineHeight: 1.7,
    color: "var(--brand-gray)",
    margin: "0 0 0.7rem",
  },
  ul: {
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.88rem",
    lineHeight: 1.7,
    color: "var(--brand-gray)",
    margin: "0 0 0.7rem",
    paddingLeft: "1.2rem",
  },
  link: {
    color: "var(--brand-green)",
  },
};
