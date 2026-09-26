import { BRAND_NAME, SITE_URL as BASE_URL } from "@/lib/brand";
import type { RouteView } from "@/lib/route-view";

/**
 * Datos estructurados del índice de rutas: la miga de pan (Home › Routes) y la
 * lista de rutas en el mismo orden en que se ven, cada una con su URL.
 */
export default function RoutesHubSchema({ routes }: { routes: RouteView[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Routes & prices",
            item: `${BASE_URL}/routes`,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: `${BRAND_NAME} shuttle routes`,
        numberOfItems: routes.length,
        itemListElement: routes.map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${BASE_URL}/routes/${r.slug}`,
          name: `${r.origin} to ${r.destination} shuttle`,
        })),
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
