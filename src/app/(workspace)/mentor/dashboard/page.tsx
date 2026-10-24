import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardPlaceholder } from "@/components/layout/dashboard-placeholder";

export default function MentorDashboardPage() {
  return <DashboardShell role="mentor"><DashboardPlaceholder role="Mentor" title="Mentor workspace" description="Your review queue, learner progress, and course activity will appear here after API integration." /></DashboardShell>;
}
