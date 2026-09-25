"use client";

import { useEffect } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import s from "./ui.module.css";

type Props = {
  message: string;
  tone?: "ok" | "error";
  onClose: () => void;
};

/**
 * Aviso flotante sobre la barra de pestañas. En el teléfono los cambios se
 * hacen en medio de la página: un aviso arriba de todo quedaría fuera de vista.
 * Los de éxito se van solos; los errores esperan a que se cierren.
 */
export default function Toast({ message, tone = "ok", onClose }: Props) {
  useEffect(() => {
    if (tone === "error") return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [message, tone, onClose]);

  return (
    <div className={`${s.toast} ${tone === "error" ? s.toastError : ""}`} role={tone === "error" ? "alert" : "status"}>
      {tone === "error" ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
