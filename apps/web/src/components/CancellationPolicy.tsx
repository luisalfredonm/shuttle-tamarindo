import { BRAND_NAME } from "@/lib/brand";

export const SUPPORT_EMAIL = "info@retanaservicestamarindo.com";

/**
 * Texto legal compartido entre el paso de firma en la reserva y la página
 * pública /cancellation, para que nunca queden dos versiones desincronizadas.
 */
export default function CancellationPolicy() {
  return (
    <>
      <p style={eyebrow}>{BRAND_NAME}</p>
      <h1 style={h1}>Cancellation &amp; No-Show Policy</h1>

      <p style={p}>
        At {BRAND_NAME}, we understand that travel plans can change. Because
        our shuttles run on strict schedules, we enforce the following
        cancellation and no-show policy to ensure fairness to all travelers.
      </p>

      <p style={p}>
        When you request a booking, we place a temporary hold on your seats
        while you complete payment. Your booking is only confirmed once
        payment has been received — unpaid holds are automatically released
        after the time shown at checkout.
      </p>

      <h2 style={h2}>1. Standard Cancellation Window (48 Hours)</h2>
      <ul style={ul}>
        <li>
          <strong>Free cancellation:</strong> You may cancel or modify your
          reservation up to 48 hours before your scheduled departure time for
          a full refund (minus any non-refundable payment processing fees, if
          applicable).
        </li>
        <li>
          <strong>Late cancellation:</strong> Cancellations made less than 48
          hours before the scheduled departure time are strictly
          non-refundable.
        </li>
      </ul>

      <h2 style={h2}>2. No-Show Policy</h2>
      <ul style={ul}>
        <li>
          If you do not arrive at the designated pickup location by the
          scheduled departure time, your booking will be marked as a No-Show.
        </li>
        <li>
          {BRAND_NAME} reserves the right to charge the full amount of the
          reserved service to the credit or debit card saved on file (Card on
          File, COF).
        </li>
        <li>
          No refunds, credits, or rescheduling will be granted for no-shows.
        </li>
      </ul>

      <h2 style={h2}>3. Flight Delays &amp; Delays Beyond Your Control</h2>
      <p style={p}>
        We know airport arrivals can be unpredictable. If your flight is
        delayed or you experience an emergency, you must contact us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={link}>
          {SUPPORT_EMAIL}
        </a>{" "}
        before your scheduled shuttle departure. We monitor flight arrivals
        and will accommodate delays whenever possible at no additional
        charge.
      </p>

      <h2 style={h2}>4. How to Cancel</h2>
      <p style={p}>
        To cancel or modify your booking, please email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={link}>
          {SUPPORT_EMAIL}
        </a>{" "}
        and include your full name, booking confirmation number and travel
        date.
      </p>

      <h2 style={h2}>5. Payment Policy</h2>
      <ul style={ul}>
        <li>Rates are net rates.</li>
        <li>Credit card payments are subject to an additional 19% tax/fee.</li>
      </ul>

      <h2 style={h2}>6. Waiting Time</h2>
      <ul style={ul}>
        <li>
          Departures to Liberia Airport: Maximum waiting time 15 minutes. If
          delayed, please reach out to us immediately.
        </li>
        <li>
          Arrivals from Liberia Airport: Up to 1 hour after landing. If
          delayed, please reach out to us immediately.
        </li>
      </ul>

      <h2 style={h2}>7. Baggage Allowance</h2>
      <p style={p}>Each passenger may bring:</p>
      <ul style={ul}>
        <li>1 carry-on item</li>
        <li>2 checked bags</li>
      </ul>

      <p style={endMarker}>End of agreement</p>
    </>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: "0.7rem",
  color: "var(--brand-gold)",
  fontFamily: "DM Sans, sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontWeight: 600,
  margin: "0 0 2px",
};

const h1: React.CSSProperties = {
  fontSize: "1.15rem",
  margin: "0 0 0.85rem",
  color: "var(--brand-dark)",
};

const h2: React.CSSProperties = {
  fontSize: "0.95rem",
  margin: "1.1rem 0 0.4rem",
  color: "var(--brand-dark)",
};

const p: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.85rem",
  lineHeight: 1.65,
  color: "var(--brand-gray)",
  margin: "0 0 0.6rem",
};

const ul: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.85rem",
  lineHeight: 1.65,
  color: "var(--brand-gray)",
  margin: "0 0 0.6rem",
  paddingLeft: "1.15rem",
};

const link: React.CSSProperties = {
  color: "var(--brand-green)",
};

const endMarker: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.75rem",
  color: "var(--brand-gray)",
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  margin: "1.25rem 0 0",
};
