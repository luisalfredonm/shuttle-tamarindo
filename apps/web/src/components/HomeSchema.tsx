import {
  BRAND_LOGO,
  BRAND_FOUNDED,
  BRAND_NAME,
  BRAND_PHONE,
  SITE_URL as BASE_URL,
} from "@/lib/brand";
import type { HomeData } from "@/lib/home-data";
import type { FaqEntry } from "@/lib/home-faq";
import { PICKUP_AREAS } from "./home/PickupAreas";

/**
 * Datos estructurados de la home, con precios de la base.
 *
 * Antes eran fijos ("$30 - $260" y un privado de $120 cuando ya costaba
 * $100): un schema que contradice la página resta confianza en vez de sumar.
 */
export default function HomeSchema({ data, faq }: { data: HomeData; faq: FaqEntry[] }) {
  const { star, sharedFrom, privateFrom } = data;
  const prices = [sharedFrom, privateFrom].filter((p): p is number => p !== null);

  const offers = star
    ? [
        ...(star.route.sharedEnabled
          ? [
              {
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: "Shared shuttle Liberia Airport to Tamarindo" },
                price: String(star.route.priceShared),
                priceCurrency: "USD",
                url: `${BASE_URL}/routes/${star.route.slug}`,
              },
            ]
          : []),
        {
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: "Private transfer Liberia Airport to Tamarindo" },
          price: String(star.route.pricePrivate),
          priceCurrency: "USD",
          url: `${BASE_URL}/routes/${star.route.slug}`,
        },
      ]
    : [];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "TransportationAgency", "Organization"],
        "@id": BASE_URL + "/#organization",
        name: BRAND_NAME,
        description: "Tamarindo shuttle and private transfers from Liberia Airport (LIR), family-run since 2015.",
        url: BASE_URL,
        foundingDate: BRAND_FOUNDED,
        logo: { "@type": "ImageObject", url: BASE_URL + BRAND_LOGO },
        telephone: BRAND_PHONE,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: BRAND_PHONE,
          contactType: "customer service",
          availableLanguage: ["English", "Spanish"],
        },
        ...(prices.length && { priceRange: `$${Math.min(...prices)} - $${Math.max(...prices)}` }),
        address: {
          "@type": "PostalAddress",
          addressLocality: "Tamarindo",
          addressRegion: "Guanacaste",
          addressCountry: "CR",
        },
        geo: { "@type": "GeoCoordinates", latitude: 10.2994, longitude: -85.8358 },
        areaServed: PICKUP_AREAS.map((name) => ({ "@type": "Place", name: `${name}, Guanacaste, Costa Rica` })),
        paymentAccepted: "PayPal",
        currenciesAccepted: "USD",
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "06:00",
          closes: "22:00",
        },
        // sameAs: se agregan cuando existan perfiles reales (Facebook, Instagram, Google Business)
        ...(offers.length && {
          hasOfferCatalog: { "@type": "OfferCatalog", name: "Shuttle services", itemListElement: offers },
        }),
      },
      {
        "@type": "WebSite",
        "@id": BASE_URL + "/#website",
        url: BASE_URL,
        name: BRAND_NAME,
        publisher: { "@id": BASE_URL + "/#organization" },
      },
      {
        // Google ya no muestra estas preguntas como resultado enriquecido
        // para este tipo de negocio, pero los buscadores con IA sí las usan
        "@type": "FAQPage",
        "@id": BASE_URL + "/#faq",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
