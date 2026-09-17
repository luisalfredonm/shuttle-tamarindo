import type { Metadata } from "next";
import Link from "next/link";
import ContentPage, { contentStyles as s } from "@/components/ContentPage";
import { SUPPORT_EMAIL } from "@/components/CancellationPolicy";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Shuttle Bookings & Travel",
  description:
    "Answers to common questions about Retana Services Tamarindo shuttles: booking, luggage, flight delays, pickup times, payment and cancellations in Guanacaste, Costa Rica.",
  alternates: { canonical: "/faq" },
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I book a shuttle?",
    a: (
      <>
        Choose your route and date on our{" "}
        <Link href="/routes" style={s.link}>
          routes
        </Link>{" "}
        page, select shared seats or a private transfer, and pay online. You will
        receive a confirmation by email and WhatsApp.
      </>
    ),
  },
  {
    q: "How far in advance should I book?",
    a: "We recommend booking at least 24 hours ahead, and earlier during high season (December–April), when shuttles fill up quickly.",
  },
  {
    q: "What is the difference between a shared shuttle and a private transfer?",
    a: "A shared shuttle is priced per person and may carry other passengers on fixed departure times. A private transfer reserves the whole vehicle for your group, with a pickup time you choose and no stops.",
  },
  {
    q: "How much luggage can I bring?",
    a: "Each passenger may bring 1 carry-on item and 2 checked bags at no extra charge. If you are travelling with oversized items (surfboards, golf bags), let us know in advance.",
  },
  {
    q: "What happens if my flight is delayed?",
    a: (
      <>
        On airport arrivals we track your flight in real time and adjust to
        delays at no extra cost. If plans change, contact us on WhatsApp or at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={s.link}>
          {SUPPORT_EMAIL}
        </a>{" "}
        before your scheduled departure.
      </>
    ),
  },
  {
    q: "Where will the driver meet me?",
    a: "For hotel pickups, your driver meets you at the lobby at the scheduled time. For airport arrivals, the driver waits in the arrivals hall with a sign showing your name.",
  },
  {
    q: "How do I pay?",
    a: "Payments are made securely online at the time of booking. Your booking is confirmed once payment is received.",
  },
  {
    q: "I lost my confirmation email. How do I find my booking?",
    a: (
      <>
        Go to{" "}
        <Link href="/find-booking" style={s.link}>
          find my booking
        </Link>{" "}
        and enter the email you booked with. We will send you a link to each of
        your bookings, so you can check the details or finish a payment without
        creating an account.
      </>
    ),
  },
  {
    q: "What is your cancellation policy?",
    a: (
      <>
        Free cancellation up to 48 hours before departure; later cancellations
        and no-shows are non-refundable. Full details on our{" "}
        <Link href="/cancellation" style={s.link}>
          cancellation policy
        </Link>{" "}
        page.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <ContentPage
      title="Frequently asked questions"
      intro="Everything you need to know before you travel. Still have a question? Reach us on WhatsApp — we're glad to help."
    >
      {FAQS.map((item) => (
        <section key={item.q}>
          <h2 style={s.h2}>{item.q}</h2>
          <p style={s.p}>{item.a}</p>
        </section>
      ))}
    </ContentPage>
  );
}
