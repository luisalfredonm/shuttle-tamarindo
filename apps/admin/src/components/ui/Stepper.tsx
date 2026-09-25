"use client";

import { Minus, Plus } from "lucide-react";
import s from "./ui.module.css";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number;
  /** Nombre para lectores de pantalla en los botones −/+ */
  label: string;
};

/** Número con botones −/+ grandes: se ajusta con el pulgar sin abrir el teclado */
export default function Stepper({ id, value, onChange, min, max, step = 1, label }: Props) {
  const n = Number(value);
  const valid = value !== "" && Number.isFinite(n);
  const clamp = (x: number) => String(Math.min(max, Math.max(min, Math.round(x / step) * step)));

  return (
    <div className={s.stepper}>
      <button
        type="button"
        onClick={() => onChange(clamp((valid ? n : min) - step))}
        disabled={valid && n <= min}
        aria-label={`Less ${label}`}
      >
        <Minus size={18} strokeWidth={2.5} />
      </button>
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        onBlur={() => valid && onChange(clamp(n))}
        required
      />
      <button
        type="button"
        onClick={() => onChange(clamp((valid ? n : min) + step))}
        disabled={valid && n >= max}
        aria-label={`More ${label}`}
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
