import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-0">
      <DashboardSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
