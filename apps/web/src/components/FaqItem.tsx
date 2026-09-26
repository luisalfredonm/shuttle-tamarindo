"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Pregunta del FAQ.
 *
 * La respuesta se renderiza siempre y se colapsa con CSS. Antes se montaba
 * recien al hacer clic, asi que el HTML servido tenia las preguntas y ninguna
 * respuesta: un buscador o un motor de IA que no ejecuta JavaScript veia una
 * pagina que preguntaba cuatro cosas y no contestaba ninguna, justo el
 * contenido con mas posibilidades de ser citado.
 *
 * La pregunta va en un h3 porque los encabezados en forma de pregunta son lo
 * que usan los extractores para trocear la pagina en respuestas citables.
 */
export default function FaqItem({
  q,
  a,
  id,
  link,
}: {
  q: string;
  a: string;
  id: string;
  /** Enlace opcional al final de la respuesta ("Read the full policy") */
  link?: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${id}`;

  return (
    <div
      style={{
        border: "1px solid #e8e4dc",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <h3 style={{ margin: 0 }}>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={panelId}
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
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            fontSize: "0.95rem",
            color: "var(--brand-dark)",
          }}
        >
          <span>{q}</span>
          <span
            aria-hidden="true"
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
      </h3>

      {/* grid 0fr -> 1fr colapsa sin sacar el texto del documento */}
      <div
        id={panelId}
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.24s ease",
          background: "var(--brand-cream)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "0 1.25rem 1.1rem",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.9rem",
              color: "var(--brand-gray)",
              lineHeight: 1.7,
            }}
          >
            {a}
            {link && (
              <>
                {" "}
                <Link href={link.href} style={{ color: "var(--brand-green)", fontWeight: 500 }}>
                  {link.label}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
