"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/tables/filter-bar";
import { DataTable, type Column } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import { StatusBadge } from "@/components/feedback/status-badge";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useSubmissions } from "@/features/submissions/hooks/use-submissions";
import type { Submission } from "@/types/domain";

export default function SubmissionsPage() {
  const { isStudent, isMentor, isAdmin } = usePermissions();
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSubmissions({
    page,
    limit: 8,
    status: status === "ALL" ? undefined : status,
  });

  const getPageTitle = () => {
    if (isStudent) return "My Submissions";
    if (isMentor) return "Mentor Review Queue";
    return "Global Submissions & Reviews";
  };

  const getPageDescription = () => {
    if (isStudent) return "Track your assignment attempts, evaluation outcomes, and mentor feedback.";
    if (isMentor) return "Review student submissions for your assigned challenges and provide evaluation decisions and feedback.";
    return "Administrative oversight of all student submissions and mentor evaluations across the platform.";
  };

  const columns: Column<Submission>[] = [
    {
      header: "Submission",
      cell: (sub) => (
        <div>
          <Link
            href={`/submissions/${sub.id}`}
            className="font-semibold text-slate-900 hover:text-brand-600 transition"
          >
            {sub.projectName || `Submission #${sub.id.slice(-6)}`}
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>
              Student:{" "}
              <strong className="text-slate-700">
                {sub.student?.name || sub.student?.email || sub.studentId.slice(0, 8)}
              </strong>
            </span>
            <span>•</span>
            <span>Attempt #{sub.attemptNumber}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Assignment",
      cell: (sub) => (
        <div className="max-w-xs">
          <Link
            href={`/assignments/${sub.assignmentId}`}
            className="text-xs font-semibold text-brand-700 hover:underline truncate block"
          >
            {sub.assignment?.title || sub.assignmentId}
          </Link>
          {sub.assignment?.submissionPolicy && (
            <span className="text-[11px] text-slate-400">
              {sub.assignment.submissionPolicy === "ONE_TIME"
                ? "Single Attempt"
                : "Resubmissions Allowed"}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (sub) => <StatusBadge status={sub.status} />,
    },
    {
      header: "Score",
      cell: (sub) => (
        <span className="text-xs font-semibold text-slate-800">
          {sub.score !== undefined ? `${sub.score}%` : "—"}
        </span>
      ),
    },
    {
      header: "Submitted",
      cell: (sub) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={13} className="text-slate-400" />
          <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      headerClassName: "text-right",
      cell: (sub) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            asChild
            size="sm"
            variant={
              (sub.status === "PENDING" || sub.status === "UNDER_REVIEW") &&
              (isMentor || isAdmin)
                ? "default"
                : "outline"
            }
            className="h-8 text-xs"
          >
            <Link href={`/submissions/${sub.id}`}>
              {isStudent ? "View Feedback" : "Review"}
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RequirePermission
      permissions={[
        PERMISSIONS.SUBMISSION_READ_OWN,
        PERMISSIONS.SUBMISSION_READ_ASSIGNED,
        PERMISSIONS.SUBMISSION_READ_ALL,
      ]}
    >
      <DashboardShell>
        <PageHeader title={getPageTitle()} description={getPageDescription()} />

        <FilterBar
          statusFilter={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          statusOptions={[
            { label: "All Statuses", value: "ALL" },
            { label: "Pending", value: "PENDING" },
            { label: "Under Review", value: "UNDER_REVIEW" },
            { label: "Approved", value: "APPROVED" },
            { label: "Needs Revision", value: "REJECTED" },
            { label: "Resubmission Requested", value: "RESUBMISSION_REQUESTED" },
          ]}
        />

        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          emptyTitle="No submissions found"
          emptyDescription="There are currently no submissions matching your filters."
        />

        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          limit={data?.limit ?? 8}
          onPageChange={setPage}
        />
      </DashboardShell>
    </RequirePermission>
  );
}
