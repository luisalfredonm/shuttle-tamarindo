import AdminLayout from "@/components/layout/AdminLayout";
import TripsContent from "@/components/TripsContent";

export const metadata = { title: "Trips" };

export default function TripsPage() {
  return (
    <AdminLayout>
      <TripsContent />
    </AdminLayout>
  );
}
