import AdminLayout from "@/components/layout/AdminLayout";
import RoutesContent from "@/components/RoutesContent";

export const metadata = { title: "Routes" };

export default function RoutesPage() {
  return (
    <AdminLayout>
      <RoutesContent />
    </AdminLayout>
  );
}
