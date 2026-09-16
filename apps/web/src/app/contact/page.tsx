import type { Metadata } from "next";
import Link from "next/link";
import ContentPage, { contentStyles as s } from "@/components/ContentPage";
import { BRAND_PHONE, BRAND_WHATSAPP } from "@/lib/brand";
import { SUPPORT_EMAIL } from "@/components/CancellationPolicy";

export const metadata: Metadata = {
  title: "Contact Us — Shuttle Bookings & Support",
  description:
    "Get in touch with Retana Services Tamarindo. Reach us on WhatsApp at +506 8318 3226 or by email for shuttle bookings, changes and support in Guanacaste, Costa Rica.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const waHref = `https://wa.me/${BRAND_WHATSAPP}?text=${encodeURIComponent(
    "Hi! I'd like information about a shuttle transfer.",
  )}`;

  return (
    <ContentPage
      title="Contact us"
      intro="Questions about a booking, a route or a custom transfer? We're happy to help — the fastest way to reach us is WhatsApp."
    >
      <h2 style={s.h2}>WhatsApp</h2>
      <p style={s.p}>
        <a href={waHref} target="_blank" rel="noopener noreferrer" style={s.link}>
          {BRAND_PHONE}
        </a>{" "}
        — quickest response for bookings, pickup details and last-minute changes.
      </p>

      <h2 style={s.h2}>Email</h2>
      <p style={s.p}>
        <a href={`mailto:${SUPPORT_EMAIL}`} style={s.link}>
          {SUPPORT_EMAIL}
        </a>{" "}
        — for cancellations, invoices and detailed enquiries. Please include your
        full name, booking confirmation number and travel date.
      </p>

      <h2 style={s.h2}>Hours</h2>
      <p style={s.p}>Every day, 06:00–22:00 (Costa Rica time, GMT-6).</p>

      <h2 style={s.h2}>Service area</h2>
      <p style={s.p}>
        Tamarindo and the wider Guanacaste province, Costa Rica. To book online,
        visit our{" "}
        <Link href="/routes" style={s.link}>
          routes
        </Link>{" "}
        page.
      </p>
    </ContentPage>
  );
}
