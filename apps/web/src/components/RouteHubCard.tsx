import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import type { RouteView } from "@/lib/route-view";

/** "1h 30m", "45m", "4h" */
function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Tarjeta de ruta del índice /routes.
 *
 * Muestra compartido y privado a la vez porque la página responde a "routes
 * and prices": quien busca precios compara las dos opciones antes de entrar.
 * El texto del enlace nombra la ruta completa ("Liberia Airport to Tamarindo
 * shuttle"), que es el anchor que la página de destino quiere posicionar.
 */
export default function RouteHubCard({
  route: r,
  bothWays = false,
}: {
  route: RouteView;
  bothWays?: boolean;
}) {
  return (
    <Link
      href={`/routes/${r.slug}`}
      className="hub-card"
      aria-label={`${r.origin} to ${r.destination} shuttle — see prices and book`}
    >
      <div className="hub-card-img">
        <Image
          src={r.heroImage}
          alt={`${r.origin} to ${r.destination} shuttle`}
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="hub-card-body">
        <h3 className="hub-card-title">
          {r.origin} <span aria-hidden="true">→</span> {r.destination}
        </h3>
        <div className="hub-card-meta">
          {bothWays && <span className="hub-both">Both ways</span>}
          <span>
            <Clock size={14} strokeWidth={2} /> {formatDuration(r.durationMin)}
          </span>
          <span>
            <MapPin size={14} strokeWidth={2} /> {r.distanceKm} km
          </span>
        </div>

        <div className="hub-card-prices">
          {r.sharedEnabled && (
            <div>
              <div className="hub-price-label">Shared shuttle</div>
              <div className="hub-price">
                <small>from</small> ${r.priceShared}
                <small>/person</small>
              </div>
            </div>
          )}
          <div>
            <div className="hub-price-label">Private transfer</div>
            <div className="hub-price">
              ${r.pricePrivate}
              <small>/van</small>
            </div>
          </div>
        </div>

        <span className="hub-card-cta">
          See times &amp; book <ArrowUpRight size={16} strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}
