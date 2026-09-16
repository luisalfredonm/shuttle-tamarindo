import { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/app/blog/posts";
import { getActiveRoutes } from "@/lib/api";
import { SITE_URL as BASE_URL } from "@/lib/brand";

/**
 * El sitemap sale de la base, no de una lista fija.
 *
 * Antes se armaba con ROUTES_DATA, asi que le pedia a Google que indexara
 * rutas dadas de baja y se salteaba las nuevas. Ahora se publica exactamente
 * lo que se puede vender.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await getActiveRoutes();

  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0 },
    { url: BASE_URL + "/routes", lastModified: new Date(), priority: 0.9 },
    { url: BASE_URL + "/blog", lastModified: new Date(), priority: 0.8 },
    { url: BASE_URL + "/about", lastModified: new Date(), priority: 0.5 },
    { url: BASE_URL + "/contact", lastModified: new Date(), priority: 0.5 },
    { url: BASE_URL + "/faq", lastModified: new Date(), priority: 0.6 },
    { url: BASE_URL + "/cancellation", lastModified: new Date(), priority: 0.3 },
    { url: BASE_URL + "/privacy", lastModified: new Date(), priority: 0.3 },
    { url: BASE_URL + "/terms", lastModified: new Date(), priority: 0.3 },
  ];

  const routePages = routes.map((r) => ({
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
