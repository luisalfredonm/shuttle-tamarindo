import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveRoutes } from "@/lib/api";
import { buildRouteView } from "@/lib/route-view";
import { BRAND_NAME } from "@/lib/brand";
import RouteDetail from "@/components/RouteDetail";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://shuttletamarindo.com";

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

export async function generateStaticParams() {
  const routes = await getActiveRoutes();
  return routes.map((r) => ({ slug: r.slug }));
}

async function findRoute(slug: string) {
  const routes = await getActiveRoutes();
  const route = routes.find((r) => r.slug === slug);
  return route ? buildRouteView(route) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const route = await findRoute(slug);
  if (!route) return {};

  const url = `${BASE_URL}/routes/${slug}`;
  const image = absoluteUrl(route.heroImage);

  return {
    title: route.metaTitle,
    description: route.metaDescription,

    // Sin esto cada ruta hereda el canonical del layout, que es la home: le
    // declara a Google que las seis landings son duplicados de la portada y
    // solo indexa una. No alcanza con que la URL este bien en produccion.
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

export default async function RouteDetailPage({ params }: Props) {
  const { slug } = await params;
  const route = await findRoute(slug);
  // La ruta no esta en la base: no se vende, no tiene pagina
  if (!route) notFound();

  return <RouteDetail route={route} />;
}
