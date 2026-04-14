import AdminLayout from "@/components/layout/AdminLayout";
import ProfileContent from "@/components/ProfileContent";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <AdminLayout>
      <ProfileContent />
    </AdminLayout>
  );
}
