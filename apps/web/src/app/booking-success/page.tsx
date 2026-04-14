import { Suspense } from "react";
import BookingSuccess from "@/components/BookingSuccess";

export const metadata = { title: "Payment Confirmed — Shuttle Tamarindo" };

export default function BookingSuccessPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <Suspense
        fallback={
          <p style={{ fontFamily: "DM Sans, sans-serif" }}>Loading...</p>
        }
      >
        <BookingSuccess />
      </Suspense>
    </main>
  );
}
