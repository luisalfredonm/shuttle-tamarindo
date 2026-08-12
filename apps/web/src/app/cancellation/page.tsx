import Link from "next/link";
import CancellationPolicy from "@/components/CancellationPolicy";

export const metadata = {
  title: "Cancellation Policy — Retana Services Tamarindo",
  description:
    "Our cancellation and no-show policy: free cancellation up to 48 hours before departure, flight delay handling, and payment terms.",
};

export default function CancellationPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        paddingTop: "calc(68px + 2rem)",
        paddingBottom: "4rem",
      }}
    >
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 2rem" }}>
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
          ← Back to home
        </Link>

        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "2.5rem",
            border: "1px solid #e8e4dc",
          }}
        >
          <CancellationPolicy />
        </div>
      </div>
    </main>
  );
}
