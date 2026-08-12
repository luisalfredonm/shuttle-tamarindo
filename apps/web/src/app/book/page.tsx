import { Suspense } from "react";
import BookResults from "@/components/BookResults";

export const metadata = {
  title: "Book Your Transfer",
  description: "Select your departure time and complete your shuttle booking.",
};

export default function BookPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        // 68px: la barra fija no debe tapar el "Back to home"
        paddingTop: "68px",
      }}
    >
      <Suspense fallback={<LoadingState />}>
        <BookResults />
      </Suspense>
    </main>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "3px solid var(--brand-green)",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p
        style={{
          color: "var(--brand-gray)",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Loading trips...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
