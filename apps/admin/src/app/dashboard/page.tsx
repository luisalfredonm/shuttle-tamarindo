import AdminLayout from "@/components/layout/AdminLayout";
import DashboardContent from "@/components/DashboardContent";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  );
}
