import { Suspense } from "react";
import BookingSuccess from "@/components/BookingSuccess";

export const metadata = { title: "Payment Confirmed — Retana Services Tamarindo" };

export default function BookingSuccessPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // 68px: la barra fija no debe tapar el contenido
        paddingTop: "calc(68px + 2rem)",
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
