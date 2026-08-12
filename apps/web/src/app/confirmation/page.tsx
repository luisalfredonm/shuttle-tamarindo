import { Suspense } from "react";
import ConfirmationDetail from "@/components/ConfirmationDetail";

export const metadata = { title: "Booking Confirmed" };

export default function ConfirmationPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        // 68px: la barra fija no debe tapar el contenido
        paddingTop: "calc(68px + 2rem)",
      }}
    >
      <Suspense
        fallback={
          <p style={{ fontFamily: "DM Sans, sans-serif" }}>Loading...</p>
        }
      >
        <ConfirmationDetail />
      </Suspense>
    </main>
  );
}
