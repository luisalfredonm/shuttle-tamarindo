import { getActiveRoutes, getPricingCached, type PricingSettings } from "./api";
import { pairRoutes } from "./route-pairs";
import { buildRouteView, type RouteView } from "./route-view";
import { sharedScheduleText } from "./days";

const isAirport = (place: string) => /airport|aeropuerto|\b(lir|sjo)\b/i.test(place);

/** "1h 30m", "45m" */
export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export interface HomeData {
  /** Una tarjeta por par de ciudades, sin la ruta estrella */
  otherRoutes: RouteView[];
  /** Liberia Airport → Tamarindo: la ruta que ataca la keyword principal */
  star?: {
    route: RouteView;
    reverse?: RouteView;
    /** "Departures on Saturdays at 10:00 AM, 2:00 PM"; null si no hay compartido */
    sharedSchedule: string | null;
  };
  /** Precio compartido más bajo por persona; null si ninguna ruta vende compartido */
  sharedFrom: number | null;
  /** Precio privado más bajo por van */
  privateFrom: number | null;
  pricing: PricingSettings;
}

/**
 * Todo lo que la home dice con números, sacado de la base.
 *
 * El texto de la home nombra precios, duración y horarios: si vivieran en el
 * código quedarían viejos al primer cambio en el panel, que es lo que pasaba
 * con el "$120" del schema cuando el privado ya costaba $100.
 */
export async function getHomeData(): Promise<HomeData> {
  const [routes, pricing] = await Promise.all([getActiveRoutes(), getPricingCached()]);
  const pairs = pairRoutes(routes).map(({ route, reverse }) => ({
    route: buildRouteView(route),
    reverse: reverse ? buildRouteView(reverse) : undefined,
  }));

  const starPair = pairs.find(
    ({ route }) => isAirport(route.origin) && /liberia/i.test(route.origin) && /tamarindo/i.test(route.destination),
  );

  const all = pairs.flatMap(({ route, reverse }) => (reverse ? [route, reverse] : [route]));
  const shared = all.filter((r) => r.sharedEnabled).map((r) => r.priceShared);
  const priv = all.map((r) => r.pricePrivate);

  return {
    otherRoutes: pairs.filter((p) => p !== starPair).map((p) => p.route),
    star: starPair && {
      ...starPair,
      sharedSchedule: starPair.route.sharedEnabled
        ? sharedScheduleText(starPair.route.sharedDays, starPair.route.departureHours)
        : null,
    },
    sharedFrom: shared.length ? Math.min(...shared) : null,
    privateFrom: priv.length ? Math.min(...priv) : null,
    pricing,
  };
}
