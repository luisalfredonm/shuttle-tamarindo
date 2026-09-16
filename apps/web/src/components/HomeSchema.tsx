import {
  BRAND_LOGO,
  BRAND_FOUNDED,
  BRAND_PHONE,
  SITE_URL as BASE_URL,
} from "@/lib/brand";

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
          telephone: BRAND_PHONE,
          contactType: "customer service",
          availableLanguage: ["English", "Spanish"],
        },
        // sameAs: se agregan los perfiles (Facebook, Instagram, TripAdvisor)
        // cuando existan. Un sameAs a la raíz del dominio, sin perfil real,
        // resta credibilidad al schema en vez de sumarla.
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
        telephone: BRAND_PHONE,
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
