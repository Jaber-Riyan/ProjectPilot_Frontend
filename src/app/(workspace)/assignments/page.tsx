"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Edit3, Trash2, Eye, Calendar, Award } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/tables/filter-bar";
import { DataTable, type Column } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import { StatusBadge } from "@/components/feedback/status-badge";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionGate } from "@/components/access/permission-gate";
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useAssignments,
  useDeleteAssignment,
} from "@/features/assignments/hooks/use-assignments";
import type { Assignment } from "@/types/domain";

export default function AssignmentsPage() {
  const { canAccessAssignment } = usePermissions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useAssignments({
    page,
    limit: 6,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  });

  const deleteMutation = useDeleteAssignment();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const columns: Column<Assignment>[] = [
    {
      header: "Assignment",
      cell: (asg) => (
        <div className="max-w-md">
          <Link
            href={`/assignments/${asg.id}`}
            className="font-semibold text-slate-900 hover:text-brand-600 transition"
          >
            {asg.title}
          </Link>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{asg.description}</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (asg) => <StatusBadge status={asg.status} />,
    },
    {
      header: "Policy",
      cell: (asg) => (
        <Badge variant={asg.submissionPolicy === "ONE_TIME" ? "warning" : "secondary"}>
          {asg.submissionPolicy === "ONE_TIME" ? "Single Attempt" : "Resubmittable"}
        </Badge>
      ),
    },
    {
      header: "Due Date",
      cell: (asg) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Calendar size={13} className="text-slate-400" />
          <span>
            {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : "No deadline"}
          </span>
        </div>
      ),
    },
    {
      header: "Max Score",
      cell: (asg) => (
        <div className="flex items-center gap-1 text-xs text-slate-700 font-semibold">
          <Award size={13} className="text-brand-600" />
          <span>{asg.maxScore ?? 100} pts</span>
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (asg) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Link href={`/assignments/${asg.id}`}>
              <Eye size={14} className="mr-1" /> View
            </Link>
          </Button>

          {canAccessAssignment(asg, undefined, "edit") && (
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link href={`/assignments/${asg.id}/edit`}>
                <Edit3 size={14} className="mr-1" /> Edit
              </Link>
            </Button>
          )}

          {canAccessAssignment(asg, undefined, "delete") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(asg.id)}
              className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <RequirePermission permission={PERMISSIONS.ASSIGNMENT_READ}>
      <DashboardShell>
        <PageHeader
          title="Assignments"
          description="Review challenge guidelines, submit your project repositories, and receive structured feedback."
          actions={
            <PermissionGate permission={PERMISSIONS.ASSIGNMENT_CREATE}>
              <Button asChild className="gap-2">
                <Link href="/assignments/new">
                  <Plus size={16} /> Create Assignment
                </Link>
              </Button>
            </PermissionGate>
          }
        />

        <FilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search assignments..."
          statusFilter={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          statusOptions={[
            { label: "All Statuses", value: "ALL" },
            { label: "Published", value: "PUBLISHED" },
            { label: "Drafts", value: "DRAFT" },
            { label: "Closed", value: "CLOSED" },
          ]}
        />

        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          emptyTitle="No assignments found"
          emptyDescription="There are no assignments matching your filter criteria."
        />

        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          limit={data?.limit ?? 6}
          onPageChange={setPage}
        />

        <ConfirmDialog
          open={Boolean(deleteId)}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Delete Assignment"
          description="Are you sure you want to permanently delete this assignment? Existing submissions will also be removed."
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
        />
      </DashboardShell>
    </RequirePermission>
  );
}
