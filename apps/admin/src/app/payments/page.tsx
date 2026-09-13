import AdminLayout from "@/components/layout/AdminLayout";
import PaymentsContent from "@/components/PaymentsContent";

export const metadata = { title: "Payments" };

export default function PaymentsPage() {
  return (
    <AdminLayout>
      <PaymentsContent />
    </AdminLayout>
  );
}
