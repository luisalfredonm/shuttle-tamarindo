import { BRAND_LOGO, BRAND_FOUNDED } from "@/lib/brand";

// TODO(dominio): cuando se defina el dominio definitivo, cambiarlo acá y en
// app/layout.tsx (metadataBase), app/robots.ts y app/sitemap.ts — los cuatro juntos.
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://shuttletamarindo.com";

export default function HomeSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": BASE_URL + "/#organization",
        name: "Retana Services Tamarindo",
        url: BASE_URL,
        foundingDate: BRAND_FOUNDED,
        logo: {
          "@type": "ImageObject",
          url: BASE_URL + BRAND_LOGO,
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+50688888888",
          contactType: "customer service",
          availableLanguage: ["English", "Spanish"],
        },
        sameAs: [
          "https://www.tripadvisor.com",
          "https://www.facebook.com",
          "https://www.instagram.com",
        ],
        areaServed: {
          "@type": "State",
          name: "Guanacaste",
          containedInPlace: {
            "@type": "Country",
            name: "Costa Rica",
          },
        },
      },
      {
        "@type": "LocalBusiness",
        "@id": BASE_URL + "/#localbusiness",
        name: "Retana Services Tamarindo",
        description:
          "Shared shuttles and private transfers in Guanacaste, Costa Rica.",
        url: BASE_URL,
        telephone: "+50688888888",
        priceRange: "$30 - $260",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Tamarindo",
          addressRegion: "Guanacaste",
          addressCountry: "CR",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 10.2994,
          longitude: -85.8358,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "06:00",
          closes: "22:00",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Shuttle Services",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Shared Shuttle Tamarindo to Liberia Airport",
              },
              price: "30",
              priceCurrency: "USD",
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Private Transfer Tamarindo to Liberia Airport",
              },
              price: "120",
              priceCurrency: "USD",
            },
          ],
        },
      },
      {
        "@type": "WebSite",
        "@id": BASE_URL + "/#website",
        url: BASE_URL,
        name: "Retana Services Tamarindo",
        publisher: { "@id": BASE_URL + "/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: BASE_URL + "/book?route={route}&date={date}",
          },
          "query-input": "required name=route",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
