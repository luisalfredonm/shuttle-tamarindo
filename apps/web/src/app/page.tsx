import Hero from "@/components/Hero";
import BookingSearch from "@/components/BookingSearch";
import Routes from "@/components/Routes";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import HomeSchema from "@/components/HomeSchema";

export default function HomePage() {
  return (
    <>
      <HomeSchema />
      <main>
        <Hero />
        <BookingSearch />
        <Routes />
        <WhyUs />
        <HowItWorks />
      </main>
    </>
  );
}
