import type { Metadata } from "next";
import AccountPage from "@/components/AccountPage";

export const metadata: Metadata = {
  title: "My Bookings",
  description: "Manage your shuttle bookings and transfers.",
};

export default function Account() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        paddingTop: "68px",
      }}
    >
      <AccountPage />
    </main>
  );
}
