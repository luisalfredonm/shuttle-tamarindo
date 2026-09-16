import { MetadataRoute } from "next";
import { SITE_URL as BASE_URL } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/payment", "/confirmation", "/booking-success"],
    },
    sitemap: BASE_URL + "/sitemap.xml",
  };
}
