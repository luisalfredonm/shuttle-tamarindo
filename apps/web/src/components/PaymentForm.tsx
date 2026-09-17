"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { bookingFetch, getPaymentMethods, PaymentMethod } from "@/lib/api";
import BookingLegs from "./BookingLegs";

declare global {
  interface Window {
    paypal?: any;
  }
}

/**
 * Carga el SDK de PayPal una sola vez por sesión.
 *
 * El clientId decide qué cuenta cobra, así que si cambia (de sandbox a live)
 * el script viejo ya no sirve: se descarta y se pide de nuevo.
 */
function loadPayPalSdk(clientId: string): Promise<any> {
  const previous = document.querySelector<HTMLScriptElement>(
    "script[data-paypal-sdk]",
  );

  if (previous && previous.dataset.clientId === clientId && window.paypal) {
    return Promise.resolve(window.paypal);
  }

  if (previous && previous.dataset.clientId !== clientId) {
    previous.remove();
    delete window.paypal;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}` +
      `&currency=USD&intent=capture`;
    script.dataset.paypalSdk = "true";
    script.dataset.clientId = clientId;
    script.onload = () =>
      window.paypal
        ? resolve(window.paypal)
        : reject(new Error("PayPal no cargó"));
    script.onerror = () => reject(new Error("PayPal no cargó"));
    document.body.appendChild(script);
  });
}

export default function PaymentForm() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("bookingId") || "";
  // Enlace secreto de la reserva: deja pagar sin tener cuenta
  const token = params.get("t") || "";

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  // null = todavía no se calculó. Distinto de 0 (vencido de verdad): si
  // arrancara en 0, hay un instante entre que llega el booking y el primer
  // tick del interval (hasta 1s) donde se pintaría "expiró" por error.
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // null = todavía no se preguntó; [] = no hay ninguno disponible
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [sdkError, setSdkError] = useState(false);

  const buttonsRef = useRef<HTMLDivElement>(null);
  // Los botones de PayPal los dibuja el SDK, no React: sin esta guarda se
  // volverían a montar en cada tick del contador
  const renderedRef = useRef(false);

  // El monto y el id de la reserva viajan por ref para no tener que volver a
  // dibujar los botones cuando cambia el estado
  const bookingIdRef = useRef(bookingId);
  bookingIdRef.current = bookingId;

  const paypal = methods?.find(
    (m) => m.provider === "PAYPAL" && m.publicKey,
  );

  // Cargar booking
  useEffect(() => {
    if (!bookingId) return;
    bookingFetch(`/bookings/${bookingId}`, token || undefined)
      .then((b) => {
        setBooking(b);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingId, token]);

  // Métodos de pago disponibles
  useEffect(() => {
    getPaymentMethods().then(setMethods);
  }, []);

  // Countdown del hold
  useEffect(() => {
    if (!booking?.heldUntil) return;

    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(booking.heldUntil).getTime() - Date.now()) / 1000),
      );
      setTimeLeft(diff);
      return diff;
    };

    // Se calcula ya mismo: no esperar el primer tick del interval
    if (tick() === 0) return;

    const interval = setInterval(() => {
      if (tick() === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  // Botones de PayPal
  useEffect(() => {
    if (!paypal?.publicKey || !booking || renderedRef.current) return;
    if (booking.status !== "PENDING") return;

    let buttons: any;
    let cancelled = false;

    loadPayPalSdk(paypal.publicKey)
      .then((sdk) => {
        if (cancelled || !buttonsRef.current) return;
        renderedRef.current = true;

        buttons = sdk.Buttons({
          style: { layout: "vertical", shape: "rect", label: "pay" },

          // El importe lo pone el servidor desde la reserva: acá solo se dice
          // cuál es la reserva
          createOrder: async () => {
            setError("");
            const order = await bookingFetch(
              "/payments/order",
              token || undefined,
              {
                method: "POST",
                body: JSON.stringify({ reservationId: bookingIdRef.current }),
              },
            );
            return order.orderId;
          },

          // Aprobar no es cobrar: la reserva se confirma cuando el servidor
          // captura contra PayPal y verifica el importe
          onApprove: async (data: { orderID: string }) => {
            setPaying(true);
            try {
              await bookingFetch(
                "/payments/capture",
                token || undefined,
                {
                  method: "POST",
                  body: JSON.stringify({ orderId: data.orderID }),
                },
              );
              const secret = token ? `&t=${encodeURIComponent(token)}` : "";
              router.push(
                `/booking-success?bookingId=${bookingIdRef.current}${secret}`,
              );
            } catch (e: any) {
              setPaying(false);
              setError(
                e.message ||
                  "We could not confirm your payment. Write to us before paying again.",
              );
            }
          },

          onCancel: () => {
            setError(
              "Payment canceled. Your seats stay held until the timer runs out.",
            );
          },

          onError: () => {
            setError("Payment failed. Please try again.");
          },
        });

        return buttons.render(buttonsRef.current);
      })
      .catch(() => setSdkError(true));

    return () => {
      cancelled = true;
      // close() saca los iframes del SDK: sin esto quedan vivos al navegar
      if (buttons?.close) buttons.close();
      renderedRef.current = false;
    };
    // token sale de la URL y no cambia mientras la pantalla vive
  }, [paypal?.publicKey, booking, token, router]);

  const mins = String(Math.floor((timeLeft ?? 0) / 60)).padStart(2, "0");
  const secs = String((timeLeft ?? 0) % 60).padStart(2, "0");

  if (loading)
    return (
      <p style={{ fontFamily: "DM Sans, sans-serif" }}>Loading booking...</p>
    );
  if (!booking)
    return (
      <div style={{ fontFamily: "DM Sans, sans-serif", textAlign: "center" }}>
        <p style={{ marginBottom: "0.75rem" }}>
          We could not open this booking. The link may be incomplete or
          expired.
        </p>
        <Link href="/find-booking" style={{ color: "var(--brand-green)" }}>
          Email me my booking link
        </Link>
      </div>
    );

  const isRoundTrip = booking.tripType === "ROUND_TRIP";
  const expired = timeLeft === 0 && booking.status === "PENDING";
  const noticeStyle = {
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "1.5rem",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.85rem",
  } as const;

  return (
    <div style={{ maxWidth: "480px", width: "100%" }}>
      <Link
        href="/"
        style={{
          color: "var(--brand-green)",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.9rem",
          textDecoration: "none",
          display: "inline-block",
          marginBottom: "1.5rem",
        }}
      >
        ← Back
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
        Complete Payment
      </h1>
      <p
        style={{
          color: "var(--brand-gray)",
          fontFamily: "DM Sans, sans-serif",
          marginBottom: "2rem",
        }}
      >
        Your seats are reserved. Complete payment to confirm.
      </p>

      {/* Countdown */}
      {timeLeft !== null && timeLeft > 0 && (
        <div
          style={{
            background: timeLeft < 120 ? "#fff5e6" : "#f0faf5",
            border: `1px solid ${timeLeft < 120 ? "#f0a500" : "var(--brand-green)"}`,
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.9rem",
              color: "var(--brand-dark)",
            }}
          >
            Time to complete payment
          </span>
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: timeLeft < 120 ? "#f0a500" : "var(--brand-green)",
            }}
          >
            {mins}:{secs}
          </span>
        </div>
      )}

      {expired && (
        // Acá timeLeft ya se calculó de verdad (no es el default): 0 significa vencido
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid #ffc5c5",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "1.5rem",
            color: "#c0392b",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.9rem",
          }}
        >
          Your reservation expired. Please start a new booking.
        </div>
      )}

      {/* Booking summary */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "1.5rem",
          border: "1px solid #e8e4dc",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            fontSize: "0.9rem",
            color: "var(--brand-gray)",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Booking Summary
        </h3>

        {/* Los tramos que se están pagando. Con ida y vuelta el total cubre
            dos salidas y hay que verlas antes de pagar */}
        <div style={{ marginBottom: "1rem" }}>
          <BookingLegs legs={booking.legs} />
        </div>

        {[
          {
            label: "Trip type",
            value: isRoundTrip ? "Round trip" : "One way",
          },
          { label: "Type", value: booking.type },
          { label: "Passengers", value: `${booking.passengers}` },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #f5f2ec",
            }}
          >
            <span
              style={{
                color: "var(--brand-gray)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.9rem",
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
                fontSize: "0.9rem",
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "1rem",
            marginTop: "0.5rem",
          }}
        >
          <span style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}>
            Total
          </span>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--brand-green)",
            }}
          >
            ${booking.totalAmount}
          </span>
        </div>
      </div>

      {/* Modo de prueba: el cliente tiene que saber que no se le cobra */}
      {paypal?.mode === "sandbox" && (
        <div
          style={{
            ...noticeStyle,
            background: "#fffbf0",
            border: "1px solid #f0d080",
            color: "#856404",
          }}
        >
          Test mode. No real charge is made.
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            ...noticeStyle,
            background: "#fff0f0",
            border: "1px solid #ffc5c5",
            color: "#c0392b",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Zona de pago */}
      {!expired && (
        <>
          {methods === null && (
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.9rem",
                color: "var(--brand-gray)",
              }}
            >
              Loading payment options...
            </p>
          )}

          {methods !== null && !paypal && (
            <div
              style={{
                ...noticeStyle,
                background: "#fff5e6",
                border: "1px solid #f0a500",
                color: "#856404",
                fontSize: "0.9rem",
              }}
            >
              Online payment is unavailable right now. Your seats are held —
              write to us at reservas@retanaservices.com to confirm this
              booking.
            </div>
          )}

          {sdkError && (
            <div
              style={{
                ...noticeStyle,
                background: "#fff0f0",
                border: "1px solid #ffc5c5",
                color: "#c0392b",
                fontSize: "0.9rem",
              }}
            >
              PayPal could not load. Check your connection and reload the page.
            </div>
          )}

          {paying && (
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.9rem",
                color: "var(--brand-gray)",
                marginBottom: "0.75rem",
              }}
            >
              Confirming your payment...
            </p>
          )}

          {/* Lo dibuja el SDK de PayPal: React no toca lo de adentro */}
          <div
            ref={buttonsRef}
            style={{ opacity: paying ? 0.5 : 1, minHeight: paypal ? 150 : 0 }}
          />
        </>
      )}

      <p
        style={{
          textAlign: "center",
          marginTop: "1rem",
          color: "var(--brand-gray)",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.8rem",
        }}
      >
        256-bit SSL encryption · Secure payment
      </p>
    </div>
  );
}
