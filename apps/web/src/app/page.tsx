import Hero from "@/components/Hero";
import BookingSearch from "@/components/BookingSearch";
import Routes from "@/components/Routes";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import HomeSchema from "@/components/HomeSchema";
import { getActiveRoutes } from "@/lib/api";

export default async function HomePage() {
  // Las rutas salen de la base y se resuelven acá, en el servidor: llegan en el
  // HTML inicial, sin un select vacío en el primer render ni para el crawler.
  const routes = await getActiveRoutes();

  return (
    <>
      <HomeSchema />
      <main>
        <Hero />
        <BookingSearch routes={routes} />
        <Routes />
        <WhyUs />
        <HowItWorks />
      </main>
    </>
  );
}
