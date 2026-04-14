import { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/app/blog/posts";
import { ROUTES_DATA } from "@/lib/routes-data";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://shuttletamarindo.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0 },
    { url: BASE_URL + "/routes", lastModified: new Date(), priority: 0.9 },
    { url: BASE_URL + "/blog", lastModified: new Date(), priority: 0.8 },
  ];

  const routePages = ROUTES_DATA.map((r) => ({
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
