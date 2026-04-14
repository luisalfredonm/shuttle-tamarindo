import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRouteBySlug, ROUTES_DATA } from "@/lib/routes-data";
import RouteDetail from "@/components/RouteDetail";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ROUTES_DATA.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const route = getRouteBySlug(slug);
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
  const route = getRouteBySlug(slug);
  if (!route) notFound();

  return <RouteDetail route={route} />;
}
