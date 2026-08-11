import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Retana Services Tamarindo account.",
};

export default function LoginPage() {
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
      {/* useSearchParams (returnTo) exige un boundary de Suspense */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
