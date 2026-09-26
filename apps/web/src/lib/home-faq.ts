import { formatDuration, type HomeData } from "./home-data";

export interface FaqEntry {
  q: string;
  a: string;
  link?: { href: string; label: string };
}

/**
 * Preguntas de la home ("Tamarindo shuttle FAQ").
 *
 * Se arman con los datos reales para que la respuesta visible y la del schema
 * digan lo mismo y no queden viejas. Si una pieza no existe (por ejemplo, la
 * ruta de Liberia no se vende), su pregunta no se publica en vez de responder
 * con un precio inventado.
 */
export function buildHomeFaq(data: HomeData): FaqEntry[] {
  const { star, pricing } = data;
  const r = star?.route;
  const faq: FaqEntry[] = [];

  if (r) {
    const shared = r.sharedEnabled ? `A shared shuttle between Liberia Airport and Tamarindo costs $${r.priceShared} per person. ` : "";
    faq.push({
      q: "How much is a shuttle in Tamarindo?",
      a: `${shared}A private transfer costs $${r.pricePrivate} per van for up to ${pricing.includedPassengers} passengers, plus $${pricing.extraPassengerPrice} per extra passenger.`,
    });
    faq.push({
      q: "How do I get from Liberia Airport to Tamarindo?",
      a: `The easiest way is a shuttle: ${r.sharedEnabled ? "shared on fixed departures, or private at the time you land" : "a private transfer at the time you land"}. Your driver meets you at arrivals. The ride takes about ${formatDuration(r.durationMin)}.`,
      link: { href: `/routes/${r.slug}`, label: "Liberia Airport to Tamarindo shuttle →" },
    });
    faq.push({
      q: "How long is the ride from Liberia Airport to Tamarindo?",
      a: `About ${formatDuration(r.durationMin)} (${r.distanceKm} km), depending on traffic.`,
    });
  }

  faq.push(
    {
      q: "Shared or private: which is better for my group?",
      a: "For one or two travelers, the shared shuttle is usually cheaper. From about three people, or if your flight doesn't match the shared schedule, a private van is better value.",
    },
    {
      q: "Can I bring surfboards and extra luggage?",
      a: "Yes, at no extra cost. Let us know in your booking notes so we save space.",
    },
    {
      q: "What is the cancellation policy?",
      a: "Free cancellation up to 48 hours before departure.",
      link: { href: "/cancellation", label: "Read the full policy →" },
    },
    {
      q: "How do I pay?",
      a: "Online with PayPal. You can pay with a credit or debit card, no PayPal account needed.",
    },
  );

  return faq;
}
