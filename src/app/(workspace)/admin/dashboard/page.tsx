import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardPlaceholder } from "@/components/layout/dashboard-placeholder";

export default function AdminDashboardPage() {
  return <DashboardShell role="admin"><DashboardPlaceholder role="Admin" title="Administration overview" description="Platform statistics and management shortcuts will appear here after API integration." /></DashboardShell>;
}
