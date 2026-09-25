"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import s from "./ui.module.css";

type Props = {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Hoja que sube desde abajo en el teléfono (queda al alcance del pulgar) y
 * diálogo centrado en escritorio. Se cierra con Escape o tocando afuera.
 */
export default function Sheet({ title, subtitle, onClose, children }: Props) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // Sin esto la página de atrás se desplaza al arrastrar la hoja
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className={s.sheetBackdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={s.sheetGrip} aria-hidden="true" />
        <div className={s.sheetHead}>
          <div>
            <h2 id={titleId} className={s.sheetTitle}>{title}</h2>
            {subtitle && <p className={s.sheetSub}>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className={s.iconBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
