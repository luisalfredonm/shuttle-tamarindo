export interface RouteData {
  slug: string;
  /** Slugs anteriores de la misma página: el contenido se encuentra igual antes de renombrar la ruta en el panel */
  aliases?: string[];
  origin: string;
  destination: string;
  durationMin: number;
  distanceKm: number;
  priceShared: number;
  pricePrivate: number;
  departureHours: string[];
  /** Foto propia de la ruta. Sin ella se usa la foto general del servicio. */
  heroImage?: string;
  metaTitle: string;
  metaDescription: string;
  highlights: string[];
  faqs: { q: string; a: string }[];
  nearbyAttractions: string[];
}

/**
 * Contenido editorial de cada ruta, indexado por slug.
 *
 * IMPORTANTE: aca no van precios, horarios ni disponibilidad. Eso vive en la
 * base y lo agrega buildRouteView al armar la pagina. Si se escriben tambien
 * aca quedan viejos y la pagina termina contradiciendose sola, que es lo que
 * pasaba con los horarios de 9 AM, 2 PM y 6 PM contra los reales de la base.
 *
 * Que una ruta no este aca no rompe nada: se publica con los datos de la base
 * y sin las secciones editoriales.
 */
export const ROUTES_DATA: RouteData[] = [
  {
    // Una sola página para los dos sentidos: "liberia airport to tamarindo" y
    // su inversa son la misma búsqueda. La página es la del sentido que sale
    // del aeropuerto; el otro redirige acá (ver lib/route-pairs.ts)
    slug: "liberia-airport-to-tamarindo",
    aliases: ["liberia-airport-tamarindo"],
    origin: "Liberia Airport (LIR)",
    destination: "Tamarindo",
    durationMin: 90,
    distanceKm: 78,
    priceShared: 30,
    pricePrivate: 120,
    departureHours: [],
    metaTitle: "Liberia Airport to Tamarindo Shuttle",
    metaDescription:
      "Shared shuttle and private transfers between Liberia Airport (LIR) and Tamarindo, both ways. Meet & greet at arrivals, flight tracking, and hotel pickup for your flight home.",
    highlights: [
      "Meet & greet at LIR arrivals with your name on a sign",
      "Flight tracking — we wait if you land late",
      "Hotel pickup in Tamarindo for your return flight",
      "Air-conditioned vans, about 1.5 hours door to door",
    ],
    faqs: [
      {
        q: "How long is the shuttle from Liberia Airport to Tamarindo?",
        a: "About 1 hour and 30 minutes (78 km) under normal traffic, the same in both directions.",
      },
      {
        q: "Where do I meet the driver at Liberia Airport?",
        a: "Your driver waits at the arrivals exit of Liberia International Airport (LIR) with a sign showing your name.",
      },
      {
        q: "What if my flight arrives late?",
        a: "We track every flight in real time and adjust the pickup at no extra charge, so your driver is there when you land.",
      },
      {
        q: "How early do you pick me up in Tamarindo for my flight?",
        a: "We pick you up at your hotel or rental in Tamarindo. For international flights, plan to reach Liberia Airport about 3 hours before departure; we set the pickup time with you when you book.",
      },
      {
        q: "Do you cover hotels outside central Tamarindo?",
        a: "Yes. We cover Playa Langosta, Playa Grande, Playa Avellanas and nearby areas.",
      },
      {
        q: "Shared shuttle or private transfer: which should I book?",
        a: "The shared shuttle is priced per person on fixed departures. A private transfer is priced per van, leaves at the time you choose, and is usually better value for families and groups.",
      },
      {
        q: "How much luggage can I bring?",
        a: "Each passenger can bring one large suitcase and one carry-on. Surfboards and extra luggage: let us know in the booking notes.",
      },
    ],
    nearbyAttractions: [
      "Playa Tamarindo",
      "Playa Grande",
      "Playa Langosta",
      "Las Baulas National Park",
    ],
  },
  {
    slug: "tamarindo-arenal",
    origin: "Tamarindo",
    destination: "Arenal Volcano",
    durationMin: 240,
    distanceKm: 210,
    priceShared: 55,
    pricePrivate: 220,
    departureHours: ["7:00 AM", "9:00 AM"],
    metaTitle: "Tamarindo to Arenal Shuttle",
    metaDescription:
      "Shuttle from Tamarindo to Arenal and La Fortuna. Door-to-door service across Guanacaste with air-conditioned vehicles. Book online in 2 minutes.",
    highlights: [
      "Scenic route through Guanacaste",
      "Drop-off at your hotel in La Fortuna",
      "Comfortable air-conditioned van",
      "4-hour journey",
    ],
    faqs: [
      {
        q: "How long is the trip from Tamarindo to Arenal?",
        a: "Approximately 4 hours depending on road conditions and stops.",
      },
      {
        q: "Are there any stops along the way?",
        a: "We make one brief rest stop at a gas station or convenience store.",
      },
      {
        q: "Where are you dropped off in Arenal?",
        a: "We drop you off directly at your hotel or accommodation in La Fortuna.",
      },
    ],
    nearbyAttractions: [
      "Arenal Volcano",
      "La Fortuna Waterfall",
      "Tabacon Hot Springs",
    ],
  },
  {
    slug: "tamarindo-monteverde",
    origin: "Tamarindo",
    destination: "Monteverde",
    durationMin: 180,
    distanceKm: 150,
    priceShared: 45,
    pricePrivate: 180,
    departureHours: ["7:00 AM", "10:00 AM"],
    metaTitle: "Tamarindo to Monteverde Shuttle",
    metaDescription:
      "Shuttle from Tamarindo to Monteverde cloud forest. Door-to-door service with air-conditioned vehicles and experienced drivers. Book online in 2 minutes.",
    highlights: [
      "Scenic 3-hour mountain journey",
      "Drop-off at your hotel in Monteverde",
      "Experienced mountain drivers",
      "Air-conditioned vehicle",
    ],
    faqs: [
      {
        q: "Is the road to Monteverde paved?",
        a: "The last section of road to Monteverde is partially unpaved but our vehicles are suited for it.",
      },
      {
        q: "How long does the trip take?",
        a: "Approximately 3 hours from central Tamarindo.",
      },
      {
        q: "Can you pick me up from Playa Flamingo or Conchal?",
        a: "Yes, we offer pickups from nearby beaches for an additional small fee.",
      },
    ],
    nearbyAttractions: [
      "Monteverde Cloud Forest",
      "Santa Elena Reserve",
      "Hanging Bridges",
    ],
  },
  {
    slug: "tamarindo-san-jose",
    origin: "Tamarindo",
    destination: "San José",
    durationMin: 300,
    distanceKm: 290,
    priceShared: 65,
    pricePrivate: 260,
    departureHours: ["6:00 AM", "8:00 AM"],
    metaTitle: "Tamarindo to San José Shuttle",
    metaDescription:
      "Shuttle from Tamarindo to San Jose and SJO airport. Door-to-door service with flight tracking and air-conditioned vehicles. Book online in 2 minutes.",
    highlights: [
      "Direct to San José city center",
      "Connections to SJO airport available",
      "5-hour comfortable journey",
      "Early morning departures",
    ],
    faqs: [
      {
        q: "Can you drop me off at Juan Santamaría Airport (SJO)?",
        a: "Yes, we offer drop-off at SJO airport for the same price as San José city center.",
      },
      {
        q: "How long is the trip?",
        a: "Approximately 5 hours depending on traffic around San José.",
      },
    ],
    nearbyAttractions: [
      "San José Downtown",
      "Juan Santamaría Airport",
      "Escazú",
    ],
  },
  {
    slug: "tamarindo-nosara",
    origin: "Tamarindo",
    destination: "Nosara",
    durationMin: 120,
    distanceKm: 95,
    priceShared: 35,
    pricePrivate: 140,
    departureHours: ["9:00 AM", "2:00 PM"],
    metaTitle: "Tamarindo to Nosara Shuttle",
    metaDescription:
      "Shuttle from Tamarindo to Nosara. Door-to-door service along the Guanacaste coast with air-conditioned vehicles. Book online in 2 minutes.",
    highlights: [
      "Scenic coastal route",
      "Drop-off at Nosara, Playa Guiones or Playa Pelada",
      "2-hour journey",
      "Daily departures",
    ],
    faqs: [
      {
        q: "Do you go directly to Playa Guiones?",
        a: "Yes, we drop off at Playa Guiones, Playa Pelada and surrounding areas.",
      },
      {
        q: "Is the road to Nosara paved?",
        a: "Most of the route is paved. The last few kilometers may be unpaved depending on the season.",
      },
    ],
    nearbyAttractions: [
      "Playa Guiones",
      "Nosara Yoga Institute",
      "Ostional Wildlife Refuge",
    ],
  },
];

export function getRouteBySlug(slug: string): RouteData | undefined {
  return ROUTES_DATA.find((r) => r.slug === slug || r.aliases?.includes(slug));
}
