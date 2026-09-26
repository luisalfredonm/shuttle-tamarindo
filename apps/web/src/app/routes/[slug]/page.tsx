import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getActiveRoutes, type Route } from "@/lib/api";
import { buildRouteView } from "@/lib/route-view";
import {
  isPrimaryOfPair,
  LEGACY_ROUTE_SLUGS,
  pairRoutes,
} from "@/lib/route-pairs";
import { BRAND_NAME, SITE_URL as BASE_URL } from "@/lib/brand";
import type { RouteView } from "@/lib/route-view";
import RouteDetail from "@/components/RouteDetail";

/** Las redes exigen URL absoluta en og:image; una ruta relativa se ignora */
function absoluteUrl(src: string) {
  return src.startsWith("http") ? src : `${BASE_URL}${src}`;
}

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Las paginas que se generan salen de la base.
 *
 * Antes salian de ROUTES_DATA, asi que una ruta nueva del panel devolvia 404 y
 * una dada de baja seguia teniendo su landing viva con precio y boton de
 * reservar. Con dynamicParams las rutas creadas despues del build tampoco
 * fallan: se renderizan a demanda y quedan cacheadas.
 */
export const dynamicParams = true;
export const revalidate = 300;

/** Solo las páginas de verdad: el sentido inverso de cada par redirige */
export async function generateStaticParams() {
  return pairRoutes(await getActiveRoutes()).map(({ route }) => ({
    slug: route.slug,
  }));
}

/**
 * Resuelve qué mostrar para un slug.
 *
 * - La ruta dueña del par: su página, con el otro sentido adentro.
 * - El sentido inverso (o un duplicado): redirect 301 a la dueña. Así cada
 *   par tiene una sola URL y no se canibalizan.
 * - Un slug viejo que se renombró: redirect a su dirección nueva, solo si
 *   esa dirección existe (si no, 404 en vez de mandar a otro 404).
 */
async function resolve(slug: string) {
  const routes = await getActiveRoutes();
  const bySlug = new Map(routes.map((r) => [r.slug, r]));
  const route = bySlug.get(slug);

  if (!route) {
    const moved = LEGACY_ROUTE_SLUGS[slug];
    if (moved && bySlug.has(moved)) return { redirect: moved };
    return {};
  }

  const reverse: Route | undefined = route.reverseSlug
    ? bySlug.get(route.reverseSlug)
    : undefined;
  if (reverse && !isPrimaryOfPair(route, reverse))
    return { redirect: reverse.slug };

  return {
    route: buildRouteView(route),
    reverse: reverse ? buildRouteView(reverse) : undefined,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { route } = await resolve(slug);
  if (!route) return {};

  const url = `${BASE_URL}/routes/${route.slug}`;
  const image = absoluteUrl(route.heroImage);

  return {
    title: route.metaTitle,
    description: route.metaDescription,

    // Sin esto cada ruta hereda el canonical del layout, que es la home: le
    // declara a Google que las landings son duplicados de la portada y solo
    // indexa una. No alcanza con que la URL este bien en produccion.
    alternates: { canonical: url },

    // openGraph y twitter se definen completos, no parciales: Next reemplaza
    // el objeto entero del layout en vez de fusionarlo campo por campo, asi
    // que lo que no se repita aca desaparece. Asi se perdian url e images.
    openGraph: {
      title: route.metaTitle,
      description: route.metaDescription,
      type: "website",
      url,
      siteName: BRAND_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${route.origin} to ${route.destination} shuttle`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: route.metaTitle,
      description: route.metaDescription,
      images: [image],
    },
  };
}

/** Tarifas reales de un sentido: compartido solo si se vende, privado siempre */
function offersFor(r: RouteView) {
  const leg = `${r.origin} to ${r.destination}`;
  return [
    ...(r.sharedEnabled
      ? [
          {
            "@type": "Offer",
            name: `Shared shuttle ${leg} (per person)`,
            price: String(r.priceShared),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        ]
      : []),
    {
      "@type": "Offer",
      name: `Private transfer ${leg} (per vehicle)`,
      price: String(r.pricePrivate),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  ];
}

/**
 * JSON-LD por par de ciudades: un Service con las tarifas de los dos
 * sentidos y el breadcrumb Home › Routes › {ruta}.
 */
function RouteSchema({
  route,
  reverse,
}: {
  route: RouteView;
  reverse?: RouteView;
}) {
  const url = `${BASE_URL}/routes/${route.slug}`;
  const name = `${route.origin} to ${route.destination} Shuttle`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": url + "#service",
        serviceType: "Airport & intercity shuttle transfer",
        name,
        description: route.metaDescription,
        url,
        image: absoluteUrl(route.heroImage),
        provider: { "@id": BASE_URL + "/#organization" },
        areaServed: {
          "@type": "State",
          name: "Guanacaste",
          containedInPlace: { "@type": "Country", name: "Costa Rica" },
        },
        offers: [...offersFor(route), ...(reverse ? offersFor(reverse) : [])],
      },
      {
        "@type": "BreadcrumbList",
        "@id": url + "#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Routes",
            item: BASE_URL + "/routes",
          },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
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

export default async function RouteDetailPage({ params }: Props) {
  const { slug } = await params;
  const { route, reverse, redirect } = await resolve(slug);

  // Una sola URL por par: el inverso, los duplicados y los slugs viejos van a la dueña
  if (redirect) permanentRedirect(`/routes/${redirect}`);
  // La ruta no esta en la base: no se vende, no tiene pagina
  if (!route) notFound();

  return (
    <>
      <RouteSchema route={route} reverse={reverse} />
      <RouteDetail route={route} reverse={reverse} />
    </>
  );
}
