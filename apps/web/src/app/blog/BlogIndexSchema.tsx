import { BRAND_NAME, SITE_URL as BASE_URL } from "@/lib/brand";

export default function BlogIndexSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": BASE_URL + "/blog#webpage",
        url: BASE_URL + "/blog",
        name: "Travel Blog — Costa Rica Shuttle & Travel Tips",
        description: "Travel guides and destination tips for Guanacaste and Costa Rica.",
        inLanguage: "en",
        isPartOf: { "@id": BASE_URL + "/#website" },
        breadcrumb: { "@id": BASE_URL + "/blog#breadcrumb" },
      },
      {
        "@type": "BreadcrumbList",
        "@id": BASE_URL + "/blog#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: BASE_URL + "/blog" },
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
