import type { Metadata } from "next";
import FindBookingForm from "@/components/FindBookingForm";

export const metadata: Metadata = {
  title: "Find My Booking",
  description:
    "Lost your confirmation email? Get a link to your Retana Services Tamarindo booking sent to your inbox.",
  // Utilidad para clientes, no una pagina de captacion: no aporta nada en
  // buscadores y ensuciaria el indice
  robots: { index: false, follow: true },
};

export default function FindBookingPage() {
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
      <FindBookingForm />
    </main>
  );
}
