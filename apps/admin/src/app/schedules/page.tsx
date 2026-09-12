import AdminLayout from "@/components/layout/AdminLayout";
import SchedulesContent from "@/components/SchedulesContent";

export const metadata = { title: "Schedules" };

export default function SchedulesPage() {
  return (
    <AdminLayout>
      <SchedulesContent />
    </AdminLayout>
  );
}
