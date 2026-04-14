import { Suspense } from "react";
import PaymentForm from "@/components/PaymentForm";

export const metadata = { title: "Complete Payment" };

export default function PaymentPage() {
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
        <PaymentForm />
      </Suspense>
    </main>
  );
}
