import type { Metadata } from "next";
import Hero from "@/components/Hero";
import BookingSearch from "@/components/BookingSearch";
import Routes from "@/components/Routes";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import HomeSchema from "@/components/HomeSchema";
import StarRouteSection from "@/components/home/StarRouteSection";
import CompareSection from "@/components/home/CompareSection";
import PickupAreas from "@/components/home/PickupAreas";
import HomeFaq from "@/components/home/HomeFaq";
import FinalCta from "@/components/home/FinalCta";
import { getActiveRoutes } from "@/lib/api";
import { getHomeData } from "@/lib/home-data";
import { buildHomeFaq } from "@/lib/home-faq";
import { BRAND_HERO_IMAGE, BRAND_NAME, SITE_URL as BASE_URL } from "@/lib/brand";

/*
 * Home: ataca "tamarindo shuttle" (para esa búsqueda Google muestra portadas
 * de empresas). La búsqueda de la ruta, "liberia airport to tamarindo
 * shuttle", es de su propia página: la home le pasa autoridad con un enlace
 * con ese texto exacto (StarRouteSection) en vez de competir con ella.
 */

const TITLE = "Tamarindo Shuttle & Airport Transfers";

export async function generateMetadata(): Promise<Metadata> {
  const { sharedFrom, privateFrom } = await getHomeData();
  const prices = [
    sharedFrom !== null ? `Shared seats from $${sharedFrom} per person` : null,
    privateFrom !== null ? `private vans from $${privateFrom}` : null,
  ].filter(Boolean);
  const description = `Tamarindo shuttle and private transfers from Liberia Airport (LIR). ${prices.join(", ")}${prices.length ? ". " : ""}Family-run since 2015.`;

  // openGraph y twitter completos: Next reemplaza el objeto del layout entero
  const image = BASE_URL + BRAND_HERO_IMAGE;
  return {
    // absolute: el template "%s | …" del layout no se aplica a la home (mismo
    // segmento), así que la marca va escrita acá. ~55 caracteres, no se corta.
    title: { absolute: `${TITLE} | Retana Services` },
    description,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: BASE_URL,
      siteName: BRAND_NAME,
      title: `${TITLE} | ${BRAND_NAME}`,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: "Tamarindo shuttle van at sunset in Guanacaste" }],
    },
    twitter: { card: "summary_large_image", title: `${TITLE} | ${BRAND_NAME}`, description, images: [image] },
  };
}

export default async function HomePage() {
  // Las rutas salen de la base y se resuelven acá, en el servidor: llegan en el
  // HTML inicial, sin un select vacío en el primer render ni para el crawler.
  const [routes, data] = await Promise.all([getActiveRoutes(), getHomeData()]);
  const faq = buildHomeFaq(data);

  return (
    <>
      <HomeSchema data={data} faq={faq} />
      <main>
        <Hero sharedFrom={data.sharedFrom} privateFrom={data.privateFrom} />
        <BookingSearch routes={routes} />
        {data.star && <StarRouteSection star={data.star} />}
        <Routes routes={data.otherRoutes} />
        <CompareSection data={data} />
        <PickupAreas />
        <WhyUs />
        <HowItWorks />
        <HomeFaq faq={faq} />
        <FinalCta />
      </main>
    </>
  );
}
