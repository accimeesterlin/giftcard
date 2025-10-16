import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <DashboardSidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
