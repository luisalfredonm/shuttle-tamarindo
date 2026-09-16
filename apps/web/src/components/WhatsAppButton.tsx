import { BRAND_WHATSAPP } from "@/lib/brand";

/**
 * Botón flotante de WhatsApp, fijo abajo a la derecha en todas las páginas.
 *
 * Es un simple <a> renderizado en el servidor: llega en el HTML inicial, sin
 * JS, así que funciona aunque falle la hidratación y el crawler lo ve. Usa el
 * glifo oficial de WhatsApp (no un ícono genérico) para que se reconozca al
 * instante. El mensaje viene prellenado para bajar la fricción del primer
 * contacto.
 */
export default function WhatsAppButton() {
  const message = "Hi! I'd like information about a shuttle transfer.";
  const href = `https://wa.me/${BRAND_WHATSAPP}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="wa-fab"
    >
      <svg
        viewBox="0 0 32 32"
        width="32"
        height="32"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.73 6.4L3.2 28.8l6.57-1.72a12.75 12.75 0 0 0 6.23 1.62h.01c7.06 0 12.8-5.74 12.8-12.8 0-3.42-1.33-6.63-3.75-9.05a12.7 12.7 0 0 0-9.06-3.65zm0 23.02h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.06 1.06 1.08-3.96-.25-.4a10.6 10.6 0 0 1-1.63-5.66c0-5.86 4.77-10.63 10.66-10.63 2.85 0 5.52 1.11 7.53 3.12a10.56 10.56 0 0 1 3.12 7.53c0 5.87-4.78 10.65-10.65 10.65zm5.84-7.97c-.32-.16-1.9-.94-2.19-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.52-.54-.72-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66s1.14 3.08 1.3 3.29c.16.21 2.25 3.43 5.45 4.81.76.33 1.35.52 1.81.67.76.24 1.46.21 2 .13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37z" />
      </svg>

      <style>{`
        .wa-fab {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 60;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #25D366;
          color: #fff;
          box-shadow: 0 6px 20px -4px rgba(37,211,102,0.6);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          /* Pulso suave que llama la atención sin ser molesto */
          animation: wa-pulse 2.4s ease-out infinite;
        }
        .wa-fab:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 10px 26px -4px rgba(37,211,102,0.7);
        }
        @keyframes wa-pulse {
          0%   { box-shadow: 0 6px 20px -4px rgba(37,211,102,0.6), 0 0 0 0 rgba(37,211,102,0.45); }
          70%  { box-shadow: 0 6px 20px -4px rgba(37,211,102,0.6), 0 0 0 14px rgba(37,211,102,0); }
          100% { box-shadow: 0 6px 20px -4px rgba(37,211,102,0.6), 0 0 0 0 rgba(37,211,102,0); }
        }
        /* Respeta a quien pide menos movimiento */
        @media (prefers-reduced-motion: reduce) {
          .wa-fab { animation: none; }
        }
        @media (max-width: 640px) {
          .wa-fab { right: 16px; bottom: 16px; width: 52px; height: 52px; }
        }
      `}</style>
    </a>
  );
}
