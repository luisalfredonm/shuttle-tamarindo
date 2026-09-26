"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  /** Fracción del elemento que debe verse para disparar (0–1) */
  amount?: number;
  /** Retraso en segundos, para escalonar tarjetas */
  delay?: number;
  /** Duración en segundos */
  duration?: number;
  /** Desplazamiento vertical inicial en px */
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Aparece con fade + subida la primera vez que entra en pantalla.
 * Reemplaza a motion (`whileInView`): la librería pesaba ~48 KiB en la home
 * solo para esto. La transición es CSS (transform/opacity, compuesta en GPU)
 * y quien pide menos movimiento la ve sin animar (ver .reveal en globals.css).
 */
export default function Reveal({
  children,
  amount = 0.3,
  delay = 0,
  duration = 0.6,
  y = 24,
  className,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: amount },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [amount]);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}${className ? " " + className : ""}`}
      style={
        {
          ...style,
          "--reveal-y": `${y}px`,
          "--reveal-delay": `${delay}s`,
          "--reveal-duration": `${duration}s`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
