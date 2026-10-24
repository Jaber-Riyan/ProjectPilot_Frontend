"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AccessDenied } from "@/components/access/access-denied";

export default function AccessDeniedPage() {
  return (
    <DashboardShell>
      <AccessDenied />
    </DashboardShell>
  );
}
