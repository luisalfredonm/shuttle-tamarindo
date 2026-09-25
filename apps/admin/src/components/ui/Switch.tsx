"use client";

import { useId } from "react";
import s from "./ui.module.css";

type Props = {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
  disabled?: boolean;
};

export default function Switch({ checked, onChange, label, disabled }: Props) {
  const id = useId();
  return (
    <label className={s.switchWrap} htmlFor={id}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={s.switch}
      />
      {label}
    </label>
  );
}
