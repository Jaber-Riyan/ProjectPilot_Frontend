import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardPlaceholder } from "@/components/layout/dashboard-placeholder";

export default function StudentDashboardPage() {
  return <DashboardShell role="student"><DashboardPlaceholder role="Student" title="Your learning dashboard" description="Your enrolled courses, upcoming assignments, and submission status will appear here after API integration." /></DashboardShell>;
}
