import AdminLayout from "@/components/layout/AdminLayout";
import BookingsContent from "@/components/BookingsContent";

export const metadata = { title: "Bookings" };

export default function BookingsPage() {
  return (
    <AdminLayout>
      <BookingsContent />
    </AdminLayout>
  );
}
