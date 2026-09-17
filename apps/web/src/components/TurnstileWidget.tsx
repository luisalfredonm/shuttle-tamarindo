"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Carga el script una sola vez, aunque el widget se monte de nuevo */
function loadTurnstile(): Promise<NonNullable<Window["turnstile"]>> {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-turnstile]",
    );
    const script = existing ?? document.createElement("script");

    const done = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("Turnstile no cargó"));

    script.addEventListener("load", done);
    script.addEventListener("error", () =>
      reject(new Error("Turnstile no cargó")),
    );

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      script.dataset.turnstile = "true";
      document.head.appendChild(script);
    }
  });
}

/**
 * Captcha invisible para el checkout sin cuenta.
 *
 * Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no dibuja nada y avisa con un token
 * vacío: la reserva de invitado sigue funcionando mientras el captcha no esté
 * configurado, igual que en el servidor.
 */
export default function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  // onToken cambia en cada render del padre; por ref el widget no se vuelve a
  // dibujar. Se sincroniza en un efecto y no en el render, que es donde React
  // no permite escribir refs.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY) return;

    let widgetId: string | undefined;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !boxRef.current) return;
        widgetId = turnstile.render(boxRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onTokenRef.current(token),
          // Vencido o con error: se limpia el token para que el botón de
          // reservar no mande uno que el servidor ya va a rechazar
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
        });
      })
      .catch(() => {
        // Si Cloudflare no carga no se bloquea la reserva: el servidor deja
        // pasar cuando su verificación no responde
        onTokenRef.current("");
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={boxRef} style={{ marginTop: "1rem" }} />;
}
