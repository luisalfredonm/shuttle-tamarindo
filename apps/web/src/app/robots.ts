import { MetadataRoute } from "next";
import { SITE_URL as BASE_URL } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  const aiCrawlers = [
    "GPTBot", "OAI-SearchBot", "ClaudeBot",
    "PerplexityBot", "Google-Extended", "Amazonbot",
  ];
  return {
    rules: [
      ...aiCrawlers.map((ua) => ({ userAgent: ua, allow: "/" })),
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account", "/payment", "/confirmation", "/booking-success",
          "/login", "/register", "/find-booking", "/book", "/profile",
        ],
      },
    ],
    sitemap: BASE_URL + "/sitemap.xml",
  };
}
