import AdminLayout from "@/components/layout/AdminLayout";
import PricingContent from "@/components/PricingContent";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <AdminLayout>
      <PricingContent />
    </AdminLayout>
  );
}
