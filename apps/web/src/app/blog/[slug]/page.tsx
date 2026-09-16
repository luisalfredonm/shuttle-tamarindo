import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, BLOG_POSTS, type BlogPost } from "@/app/blog/posts";
import BlogPostContent from "@/components/BlogPostContent";
import {
  BRAND_NAME,
  BRAND_HERO_IMAGE,
  BRAND_AUTHOR,
  SITE_URL as BASE_URL,
} from "@/lib/brand";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `${BASE_URL}/blog/${slug}`;
  const image = BASE_URL + BRAND_HERO_IMAGE;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,

    // Sin canonical cada post heredaba el de la home (el del layout) y Google
    // los tomaba como duplicados de la portada: mismo error que ya se corrigió
    // en las landings de ruta.
    alternates: { canonical: url },

    // openGraph completo, no parcial: Next reemplaza el objeto entero del
    // layout, así que lo que no se repita aquí (url, siteName, images)
    // desaparece del enlace compartido.
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      url,
      siteName: BRAND_NAME,
      authors: [BRAND_AUTHOR],
      publishedTime: post.publishedAt,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [image],
    },
  };
}

/** JSON-LD BlogPosting: habilita el resultado enriquecido de artículo en Google. */
function ArticleSchema({ post }: { post: BlogPost }) {
  const url = `${BASE_URL}/blog/${post.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url + "#article",
    mainEntityOfPage: url,
    headline: post.title,
    description: post.metaDescription,
    image: BASE_URL + BRAND_HERO_IMAGE,
    articleSection: post.category,
    keywords: post.keywords.join(", "),
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    inLanguage: "en",
    author: {
      "@type": "Person",
      name: BRAND_AUTHOR,
      worksFor: { "@id": BASE_URL + "/#organization" },
    },
    publisher: {
      "@type": "Organization",
      "@id": BASE_URL + "/#organization",
      name: BRAND_NAME,
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: BASE_URL + BRAND_HERO_IMAGE },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = BLOG_POSTS.filter(
    (p) => p.slug !== slug && p.category === post.category,
  ).slice(0, 3);

  return (
    <>
      <ArticleSchema post={post} />
      <BlogPostContent post={post} related={related} />
    </>
  );
}
