import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveRoutes } from "@/lib/api";
import { buildRouteView } from "@/lib/route-view";
import RouteDetail from "@/components/RouteDetail";

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

  return {
    title: route.metaTitle,
    description: route.metaDescription,
    openGraph: {
      title: route.metaTitle,
      description: route.metaDescription,
      type: "website",
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
