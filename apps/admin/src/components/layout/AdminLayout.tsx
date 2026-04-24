import Sidebar from "./Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
