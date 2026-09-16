import type { Metadata } from "next";
import Link from "next/link";
import ContentPage, { contentStyles as s } from "@/components/ContentPage";
import { BRAND_NAME } from "@/lib/brand";
import { SUPPORT_EMAIL } from "@/components/CancellationPolicy";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions that govern bookings and transfers with Retana Services Tamarindo in Guanacaste, Costa Rica.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

const UPDATED = "September 15, 2026";

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      intro={`These terms govern your use of the ${BRAND_NAME} website and our shuttle and transfer services. By booking with us, you agree to them. Last updated ${UPDATED}.`}
    >
      <h2 style={s.h2}>1. Bookings</h2>
      <p style={s.p}>
        When you request a booking we place a temporary hold on your seats while
        you complete payment. Your booking is confirmed only once payment has
        been received; unpaid holds are released automatically after the time
        shown at checkout.
      </p>

      <h2 style={s.h2}>2. Prices &amp; payment</h2>
      <ul style={s.ul}>
        <li>Prices are shown per person (shared) or per vehicle (private).</li>
        <li>Rates are net rates and are payable at the time of booking.</li>
        <li>
          Card payments may be subject to an additional tax/fee, shown before you
          confirm.
        </li>
      </ul>

      <h2 style={s.h2}>3. Cancellations &amp; no-shows</h2>
      <p style={s.p}>
        Cancellations, refunds and no-shows are governed by our{" "}
        <Link href="/cancellation" style={s.link}>
          cancellation policy
        </Link>
        , which forms part of these terms.
      </p>

      <h2 style={s.h2}>4. Pickups &amp; waiting times</h2>
      <p style={s.p}>
        You are responsible for being ready at the agreed pickup point at the
        scheduled time and for providing accurate pickup and flight details.
        Waiting times and airport meet-and-greet conditions are described in our
        cancellation policy.
      </p>

      <h2 style={s.h2}>5. Luggage</h2>
      <p style={s.p}>
        Each passenger may bring 1 carry-on item and 2 checked bags. Oversized
        items must be declared in advance and may require a larger vehicle.
      </p>

      <h2 style={s.h2}>6. Liability</h2>
      <p style={s.p}>
        We provide our services with reasonable care and skill. To the extent
        permitted by law, {BRAND_NAME} is not liable for delays or losses caused
        by events beyond our reasonable control, including weather, road
        conditions, traffic or flight schedule changes.
      </p>

      <h2 style={s.h2}>7. Governing law</h2>
      <p style={s.p}>
        These terms are governed by the laws of the Republic of Costa Rica.
      </p>

      <h2 style={s.h2}>8. Contact</h2>
      <p style={s.p}>
        Questions about these terms? Contact us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={s.link}>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </ContentPage>
  );
}
