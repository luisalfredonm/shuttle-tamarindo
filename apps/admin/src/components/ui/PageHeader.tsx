import s from "./ui.module.css";

type Props = {
  title: string;
  subtitle?: React.ReactNode;
  /** Chips de resumen debajo del título */
  summary?: React.ReactNode;
  /** Botones: en teléfono ocupan el ancho, en escritorio van a la derecha */
  actions?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, summary, actions }: Props) {
  return (
    <header className={s.header}>
      <div>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        {summary && <div className={s.summary}>{summary}</div>}
      </div>
      {actions && <div className={s.headerActions}>{actions}</div>}
    </header>
  );
}
