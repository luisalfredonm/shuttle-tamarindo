import type { Metadata } from "next";
import Link from "next/link";
import ContentPage, { contentStyles as s } from "@/components/ContentPage";
import { BRAND_NAME, BRAND_FOUNDED } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About Us — Reliable Shuttle Service in Guanacaste",
  description:
    "Family-run since 2015, Retana Services Tamarindo provides shared shuttles and private transfers across Guanacaste, Costa Rica. Learn who we are and how we operate.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About Retana Services Tamarindo"
      intro={`Since ${BRAND_FOUNDED}, we have been moving travelers across Guanacaste with fixed daily schedules, fair prices and door-to-door service.`}
    >
      <h2 style={s.h2}>Our story</h2>
      <p style={s.p}>
        We are a transport service company founded in {BRAND_FOUNDED}. Our
        business is run by siblings, who have built and grown it with great care
        and dedication, always committed to giving every customer the best
        possible service.
      </p>

      <h2 style={s.h2}>Who we are</h2>
      <p style={s.p}>
        {BRAND_NAME} is a locally owned transportation company based in
        Tamarindo, on the Pacific coast of Guanacaste, Costa Rica. We specialize
        in airport transfers to and from Liberia International Airport (LIR) and
        intercity shuttles to the region&apos;s most popular destinations.
      </p>

      <h2 style={s.h2}>What makes us different</h2>
      <ul style={s.ul}>
        <li>
          <strong>Shared seats from $30.</strong> A shared departure opens once
          three passengers are confirmed. From then on anyone can join it, even
          travelling alone. Need to leave on your own schedule? A private
          transfer runs at any time.
        </li>
        <li>
          <strong>Door-to-door service.</strong> We pick you up at your hotel or
          accommodation and drop you off at your exact destination.
        </li>
        <li>
          <strong>Flight tracking.</strong> On airport arrivals we monitor your
          flight and adjust to delays at no extra charge.
        </li>
        <li>
          <strong>Transparent pricing.</strong> The price you see when booking
          is the price you pay — shared from $30 per person, or private by
          vehicle.
        </li>
      </ul>

      <h2 style={s.h2}>Where we operate</h2>
      <p style={s.p}>
        We serve Tamarindo and the wider Guanacaste province, including transfers
        to Liberia Airport, Arenal/La Fortuna, Monteverde and other major
        destinations across Costa Rica. See our{" "}
        <Link href="/routes" style={s.link}>
          full list of routes
        </Link>{" "}
        for prices and schedules.
      </p>
    </ContentPage>
  );
}
