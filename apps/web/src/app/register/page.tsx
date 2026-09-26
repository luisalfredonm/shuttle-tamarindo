import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Retana Services Tamarindo account to manage bookings.",
  robots: { index: false, follow: true },
  // Canonical propio: con el de la home heredado, el noindex quedaba mezclado
  // con una señal que decía "esta página es la home"
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        paddingTop: "88px",
      }}
    >
      <RegisterForm />
    </main>
  );
}
