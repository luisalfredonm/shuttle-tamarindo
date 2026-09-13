import { getRouteBySlug as getRouteContent, type RouteData } from "./routes-data";
import type { Route } from "./api";
import { BRAND_HERO_IMAGE } from "./brand";

/**
 * Une los datos operativos de la base con el contenido editorial del archivo.
 *
 * La division es por naturaleza del dato, no por comodidad:
 *
 *   base    que rutas existen, precios, horarios, duracion  -> cambia solo
 *   archivo metaTitle, FAQs, highlights, atracciones        -> lo escribe una persona
 *
 * La base manda en todo lo que se puede contradecir. Si el archivo dice $30 y
 * la base dice $35, gana la base: es lo que de verdad se va a cobrar. Asi una
 * ruta nueva del panel nunca produce un 404 aunque nadie le haya escrito el
 * contenido todavia; sale con lo que hay y se le agrega el texto despues.
 */
export type RouteView = RouteData & {
  /** false cuando la ruta todavia no tiene contenido escrito en el archivo */
  hasEditorialContent: boolean;
  sharedEnabled: boolean;
  /** Siempre resuelta: la propia de la ruta o la general del servicio */
  heroImage: string;
};

/** "08:00" -> "8:00 AM", que es como se muestra al visitante */
export function formatDepartureTime(time: string): string {
  const [rawHour, minute] = time.split(":");
  const hour = Number(rawHour);
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${minute} ${suffix}`;
}

export function buildRouteView(route: Route): RouteView {
  const content = getRouteContent(route.slug);
  const departureHours = (route.departureTimes ?? []).map(formatDepartureTime);
  const sharedEnabled = !!route.sharedEnabled;

  // Precio por asiento: el mas barato de los horarios. Sin compartido no hay
  // precio por asiento que mostrar, y el 0 se leeria como "gratis".
  const priceShared = route.priceShared ?? content?.priceShared ?? 0;

  return {
    slug: route.slug,
    origin: route.origin,
    destination: route.destination,
    durationMin: route.durationMin,
    distanceKm: route.distanceKm,
    pricePrivate: Number(route.pricePrivate),
    priceShared: Number(priceShared),
    departureHours,
    sharedEnabled,
    hasEditorialContent: !!content,

    // Foto propia mientras no haya una por ruta. Antes caia en picsum, que
    // devuelve una imagen aleatoria sin relacion con Costa Rica: no sirve ni
    // para la pagina ni para lo que se ve al compartir el enlace.
    heroImage: content?.heroImage ?? BRAND_HERO_IMAGE,

    // El texto lo escribe una persona y el precio lo pone la base: asi el copy
    // se mantiene y el dato nunca queda viejo. Antes el precio y los horarios
    // estaban escritos dentro del texto y la pagina se contradecia sola.
    metaTitle: withPrice(
      content?.metaTitle ?? `${route.origin} to ${route.destination} Shuttle`,
      sharedEnabled,
      Number(priceShared),
      Number(route.pricePrivate),
    ),
    metaDescription: content?.metaDescription
      ? withSchedule(content.metaDescription, sharedEnabled, Number(priceShared), departureHours, Number(route.pricePrivate))
      : defaultDescription(route, sharedEnabled, Number(priceShared), departureHours),

    // Sin contenido escrito se muestran vacias y la pagina omite la seccion,
    // en vez de inventar respuestas o atracciones que nadie reviso.
    highlights: content?.highlights ?? [],
    faqs: content?.faqs ?? [],
    nearbyAttractions: content?.nearbyAttractions ?? [],
  };
}

/** Agrega al titulo el precio real, que es lo que sube el CTR en Google */
function withPrice(
  title: string,
  sharedEnabled: boolean,
  priceShared: number,
  pricePrivate: number,
): string {
  return sharedEnabled
    ? `${title} — from $${priceShared}/person`
    : `${title} — from $${pricePrivate}/vehicle`;
}

/** Cierra la descripcion con los horarios y el precio que estan hoy en la base */
function withSchedule(
  description: string,
  sharedEnabled: boolean,
  priceShared: number,
  departureHours: string[],
  pricePrivate: number,
): string {
  const fact = sharedEnabled
    ? `From $${priceShared} per person, departures at ${departureHours.join(", ")}.`
    : `From $${pricePrivate} per vehicle, at the time you choose.`;

  return `${description} ${fact}`;
}

function defaultTitle(
  route: Route,
  sharedEnabled: boolean,
  priceShared: number,
): string {
  const base = `${route.origin} to ${route.destination} Shuttle`;
  return sharedEnabled
    ? `${base} — from $${priceShared}/person`
    : `${base} — Private Transfer`;
}

function defaultDescription(
  route: Route,
  sharedEnabled: boolean,
  priceShared: number,
  departureHours: string[],
): string {
  const hours = departureHours.join(", ");
  const duration = Math.round(route.durationMin / 60);

  // El texto solo afirma lo que la base respalda: sin horarios no se prometen
  // salidas diarias, que es exactamente el error que habia en el archivo.
  return sharedEnabled
    ? `Shared shuttle from ${route.origin} to ${route.destination} from $${priceShared} per person. Daily departures at ${hours}. About ${duration} hours door to door. Book online in minutes.`
    : `Private transfer from ${route.origin} to ${route.destination} from $${Number(route.pricePrivate)} per vehicle, at the time you choose. About ${duration} hours door to door. Book online in minutes.`;
}

/**
 * Precio y unidad que muestra una tarjeta de ruta.
 *
 * Sin compartido no hay precio por asiento: mostrar el priceShared daria "$0",
 * que se lee como gratis. En ese caso la tarjeta anuncia el privado, que es lo
 * que de verdad se vende en esa ruta.
 */
export function displayPrice(route: RouteView): {
  amount: number;
  unit: string;
} {
  return route.sharedEnabled
    ? { amount: route.priceShared, unit: "/person" }
    : { amount: route.pricePrivate, unit: "/vehicle" };
}
