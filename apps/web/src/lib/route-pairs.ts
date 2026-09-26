import type { Route } from "./api";

/*
 * Una página pública por par de ciudades.
 *
 * A → B y B → A responden a la misma búsqueda: dos páginas casi iguales se
 * reparten la autoridad y ninguna sube (canibalización). En la base cada
 * sentido sigue siendo su propia ruta, con horarios, precio y asientos; lo
 * que se unifica es solo la página web.
 */

const isAirport = (place: string) =>
  /airport|aeropuerto|\b(lir|sjo)\b/i.test(place);
const isHomeBase = (place: string) => /tamarindo/i.test(place);

/**
 * Qué sentido del par es el dueño de la página.
 *
 * El que sale del aeropuerto: es el que la gente busca ("liberia airport to
 * tamarindo"); casi nadie busca primero el inverso. Entre dos lugares sin
 * aeropuerto manda el que sale de Tamarindo, la base del negocio.
 */
export function isPrimaryOfPair(route: Route, reverse: Route): boolean {
  if (isAirport(route.origin) !== isAirport(reverse.origin))
    return isAirport(route.origin);
  if (isHomeBase(route.origin) !== isHomeBase(reverse.origin))
    return isHomeBase(route.origin);
  return route.slug < reverse.slug;
}

export interface RoutePair {
  /** Sentido dueño de la página */
  route: Route;
  /** El otro sentido, si también se vende */
  reverse?: Route;
}

/**
 * Las rutas agrupadas en pares, una entrada por página pública.
 *
 * Una ruta cargada dos veces con el mismo origen y destino también cae acá:
 * el duplicado queda como "otro sentido" del par y no genera página propia.
 */
export function pairRoutes(routes: Route[]): RoutePair[] {
  const bySlug = new Map(routes.map((r) => [r.slug, r]));
  const pairs: RoutePair[] = [];

  for (const route of routes) {
    const reverse = route.reverseSlug
      ? bySlug.get(route.reverseSlug)
      : undefined;
    if (reverse && !isPrimaryOfPair(route, reverse)) continue;
    pairs.push({ route, reverse });
  }
  return pairs;
}

/**
 * Direcciones viejas de páginas de ruta y a dónde se mudaron.
 *
 * Solo hace falta para slugs que cambiaron de nombre o se borraron; los
 * sentidos inversos se redirigen solos por isPrimaryOfPair.
 */
export const LEGACY_ROUTE_SLUGS: Record<string, string> = {
  "liberia-airport-tamarindo": "liberia-airport-to-tamarindo",
  "tamarindo-liberia-airport": "liberia-airport-to-tamarindo",
  "tama-liberia-airport": "liberia-airport-to-tamarindo",
};
