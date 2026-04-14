import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, BLOG_POSTS } from "@/app/blog/posts";
import BlogPostContent from "@/components/BlogPostContent";

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

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = BLOG_POSTS.filter(
    (p) => p.slug !== slug && p.category === post.category,
  ).slice(0, 3);

  return <BlogPostContent post={post} related={related} />;
}
