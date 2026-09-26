import { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/app/blog/posts";
import { getActiveRoutes } from "@/lib/api";
import { pairRoutes } from "@/lib/route-pairs";
import { SITE_URL as BASE_URL } from "@/lib/brand";

export const revalidate = 3600;

/**
 * El sitemap sale de la base, no de una lista fija.
 *
 * Antes se armaba con ROUTES_DATA, asi que le pedia a Google que indexara
 * rutas dadas de baja y se salteaba las nuevas. Ahora se publica exactamente
 * lo que se puede vender.
 *
 * lastModified fijo en páginas estáticas: evita que Googlebot vea todo como
 * "modificado hoy" en cada fetch y desperdicie crawl budget re-crawleando
 * páginas sin cambios.
 */
const LAUNCH = new Date("2026-09-25");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await getActiveRoutes();

  const staticPages = [
    { url: BASE_URL, lastModified: LAUNCH, priority: 1.0 },
    { url: BASE_URL + "/routes", lastModified: LAUNCH, priority: 0.9 },
    { url: BASE_URL + "/blog", lastModified: LAUNCH, priority: 0.8 },
    { url: BASE_URL + "/about", lastModified: LAUNCH, priority: 0.5 },
    { url: BASE_URL + "/contact", lastModified: LAUNCH, priority: 0.5 },
    { url: BASE_URL + "/faq", lastModified: LAUNCH, priority: 0.6 },
    { url: BASE_URL + "/cancellation", lastModified: LAUNCH, priority: 0.3 },
    { url: BASE_URL + "/privacy", lastModified: LAUNCH, priority: 0.3 },
    { url: BASE_URL + "/terms", lastModified: LAUNCH, priority: 0.3 },
  ];

  // Una URL por par de ciudades: el sentido inverso redirige y no se lista
  const routePages = pairRoutes(routes).map(({ route: r }) => ({
    url: `${BASE_URL}/routes/${r.slug}`,
    lastModified: new Date(),
    priority: 0.9,
  }));

  const blogPages = BLOG_POSTS.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    priority: 0.7,
  }));

  return [...staticPages, ...routePages, ...blogPages];
}
