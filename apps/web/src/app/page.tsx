import Hero from "@/components/Hero";
import BookingSearch from "@/components/BookingSearch";
import Routes from "@/components/Routes";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import HomeSchema from "@/components/HomeSchema";
import { getActiveRoutes } from "@/lib/api";
import { buildRouteView } from "@/lib/route-view";
import { pairRoutes } from "@/lib/route-pairs";

export default async function HomePage() {
  // Las rutas salen de la base y se resuelven acá, en el servidor: llegan en el
  // HTML inicial, sin un select vacío en el primer render ni para el crawler.
  const routes = await getActiveRoutes();
  // Las tarjetas enlazan a páginas de ruta: una por par, sin el inverso que redirige
  const routeViews = pairRoutes(routes).map(({ route }) => buildRouteView(route));

  return (
    <>
      <HomeSchema />
      <main>
        <Hero />
        <BookingSearch routes={routes} />
        <Routes routes={routeViews} />
        <WhyUs />
        <HowItWorks />
      </main>
    </>
  );
}
