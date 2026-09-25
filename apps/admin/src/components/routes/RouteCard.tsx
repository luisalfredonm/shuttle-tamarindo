"use client";

import { PenLine, Trash2 } from "lucide-react";
import RouteImage from "../RouteImage";
import type { AdminRoute } from "./types";
import s from "./routes.module.css";

type Props = {
  route: AdminRoute;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onImageChange: (updated: { id: string; imageUrl: string | null }) => void;
};

/** "1h 30m", "45m", "4h" */
function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const money = (n: number) => `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/**
 * Una ruta como boleto: foto con su estado, itinerario, corte perforado y
 * las tarifas del privado abajo, como el talón.
 */
export default function RouteCard({ route: r, onEdit, onDelete, onToggleActive, onImageChange }: Props) {
  const label = `${r.origin} → ${r.destination}`;
  const switchId = `live-${r.id}`;

  return (
    <article className={`${s.card} ${r.isActive ? "" : s.cardInactive}`} aria-label={label}>
      <RouteImage routeId={r.id} imageUrl={r.imageUrl} label={label} onChange={onImageChange}>
        <span className={`${s.status} ${r.isActive ? "" : s.statusOff}`}>
          {r.isActive ? "Live" : "Hidden"}
        </span>
      </RouteImage>

      <div className={s.body}>
        <div className={s.itinerary}>
          <div className={s.rail}>
            <span className={s.dot} />
            <span className={s.line} />
            <span className={`${s.dot} ${s.dotEnd}`} />
          </div>
          <div>
            <div className={s.place}>{r.origin}</div>
            <div className={s.leg}>
              {formatDuration(r.durationMin)} · {r.distanceKm} km
            </div>
            <div className={s.place}>{r.destination}</div>
          </div>
        </div>
        <div className={s.slug}>/routes/{r.slug}</div>
      </div>

      <div className={s.perforation} aria-hidden="true" />

      <div className={s.fares}>
        <div>
          <div className={s.fareLabel}>Private one way</div>
          <div className={s.fareValue}>
            {money(r.pricePrivate)}
            <span className={s.fareUnit}>/van</span>
          </div>
        </div>
        <div>
          <div className={s.fareLabel}>Private round trip</div>
          {r.pricePrivateRoundTrip === null ? (
            <div className={s.fareMissing}>Not offered</div>
          ) : (
            <div className={s.fareValue}>
              {money(r.pricePrivateRoundTrip)}
              <span className={s.fareUnit}>/van</span>
            </div>
          )}
        </div>
      </div>

      <div className={s.footer}>
        <label className={s.switchWrap} htmlFor={switchId}>
          <button
            id={switchId}
            type="button"
            role="switch"
            aria-checked={r.isActive}
            onClick={onToggleActive}
            className={s.switch}
          />
          {r.isActive ? "Live on website" : "Hidden from website"}
        </label>
        <button type="button" onClick={onEdit} className={s.btnGhost}>
          <PenLine size={14} /> Edit
        </button>
        <button type="button" onClick={onDelete} className={s.btnDanger} aria-label={`Delete route ${label}`}>
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}
