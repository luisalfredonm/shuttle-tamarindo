import ProfileForm from "@/components/ProfileForm";

export const metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
  alternates: { canonical: "/profile" },
};

export default function ProfilePage() {
  return <ProfileForm />;
}
