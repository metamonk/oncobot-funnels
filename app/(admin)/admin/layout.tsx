import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - 256px wide */}
      <div className="w-64 flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}