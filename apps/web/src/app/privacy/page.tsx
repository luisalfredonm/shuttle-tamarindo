import type { Metadata } from "next";
import ContentPage, { contentStyles as s } from "@/components/ContentPage";
import { BRAND_NAME } from "@/lib/brand";
import { SUPPORT_EMAIL } from "@/components/CancellationPolicy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Retana Services Tamarindo collects, uses and protects your personal data when you book a shuttle or create an account.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const UPDATED = "September 15, 2026";

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro={`This policy explains what personal data ${BRAND_NAME} collects, why we collect it, and the choices you have. Last updated ${UPDATED}.`}
    >
      <h2 style={s.h2}>1. Information we collect</h2>
      <ul style={s.ul}>
        <li>
          <strong>Booking details:</strong> your name, email, phone/WhatsApp
          number, pickup and drop-off locations, travel dates and flight number.
        </li>
        <li>
          <strong>Account data:</strong> if you create an account, your name,
          email and an encrypted password.
        </li>
        <li>
          <strong>Payment data:</strong> payments are processed by our payment
          provider (PayPal). We do not store your full card number on our
          servers.
        </li>
        <li>
          <strong>Usage data:</strong> basic analytics about how the site is
          used, collected through cookies (see section 4).
        </li>
      </ul>

      <h2 style={s.h2}>2. How we use your information</h2>
      <ul style={s.ul}>
        <li>To process bookings and payments and send confirmations.</li>
        <li>To coordinate your pickup and communicate about your trip.</li>
        <li>To provide customer support and handle cancellations.</li>
        <li>To improve our website and services.</li>
      </ul>

      <h2 style={s.h2}>3. Sharing with third parties</h2>
      <p style={s.p}>
        We share data only as needed to run the service: with our payment
        provider (PayPal) to process payments, with analytics providers to
        understand site usage, and with our drivers to fulfil your transfer. We
        do not sell your personal data.
      </p>

      <h2 style={s.h2}>4. Cookies &amp; analytics</h2>
      <p style={s.p}>
        We use cookies and similar technologies for essential site functionality
        and to measure traffic (for example, Google Analytics). You can control
        cookies through your browser settings.
      </p>

      <h2 style={s.h2}>5. Data retention</h2>
      <p style={s.p}>
        We keep booking and account records for as long as needed to provide the
        service and to comply with legal and accounting obligations, then delete
        or anonymize them.
      </p>

      <h2 style={s.h2}>6. Your rights</h2>
      <p style={s.p}>
        You may request access to, correction of, or deletion of your personal
        data. To do so, email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={s.link}>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>

      <h2 style={s.h2}>7. Contact</h2>
      <p style={s.p}>
        Questions about this policy? Contact {BRAND_NAME} at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={s.link}>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </ContentPage>
  );
}
