"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Edit3, Trash2, Eye } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/tables/filter-bar";
import { DataTable, type Column } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import { StatusBadge } from "@/components/feedback/status-badge";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/access/permission-gate";
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useCourses, useDeleteCourse } from "@/features/courses/hooks/use-courses";
import type { Course } from "@/types/domain";

export default function CoursesPage() {
  const { canAccessCourse } = usePermissions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);

  const { data, isLoading } = useCourses({
    page,
    limit: 6,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  });

  const deleteMutation = useDeleteCourse();

  const handleDelete = () => {
    if (deleteCourseId) {
      deleteMutation.mutate(deleteCourseId, {
        onSuccess: () => setDeleteCourseId(null),
      });
    }
  };

  const columns: Column<Course>[] = [
    {
      header: "Course",
      cell: (course) => (
        <div className="max-w-md">
          <Link
            href={`/courses/${course.id}`}
            className="font-semibold text-slate-900 hover:text-brand-600 transition"
          >
            {course.title}
          </Link>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{course.description}</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (course) => <StatusBadge status={course.status} />,
    },
    {
      header: "Level / Hours",
      cell: (course) => (
        <div className="text-xs text-slate-600">
          <span className="font-medium">{course.level ?? "Standard"}</span>
          <span className="text-slate-400"> • </span>
          <span>{course.estimatedHours ?? 0} hrs</span>
        </div>
      ),
    },
    {
      header: "Modules",
      cell: (course) => (
        <span className="text-xs font-semibold text-slate-700">
          {course.moduleIds.length} modules
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (course) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Link href={`/courses/${course.id}`} title="View syllabus">
              <Eye size={14} className="mr-1" /> View
            </Link>
          </Button>

          {canAccessCourse(course, "edit") && (
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link href={`/courses/${course.id}/edit`} title="Edit course">
                <Edit3 size={14} className="mr-1" /> Edit
              </Link>
            </Button>
          )}

          {canAccessCourse(course, "delete") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteCourseId(course.id)}
              className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete course"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <RequirePermission permission={PERMISSIONS.COURSE_READ}>
      <DashboardShell>
        <PageHeader
          title="Courses"
          description="Explore structured courses, view syllabi, and master full-stack software development topics."
          actions={
            <PermissionGate permission={PERMISSIONS.COURSE_CREATE}>
              <Button asChild className="gap-2">
                <Link href="/courses/new">
                  <Plus size={16} /> Create Course
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
          searchPlaceholder="Search courses..."
          statusFilter={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          statusOptions={[
            { label: "All Statuses", value: "ALL" },
            { label: "Published", value: "PUBLISHED" },
            { label: "Drafts", value: "DRAFT" },
            { label: "Archived", value: "ARCHIVED" },
          ]}
        />

        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          emptyTitle="No courses match your criteria"
          emptyDescription="Try adjusting your search query or status filter."
        />

        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          limit={data?.limit ?? 6}
          onPageChange={setPage}
        />

        <ConfirmDialog
          open={Boolean(deleteCourseId)}
          onOpenChange={(open) => !open && setDeleteCourseId(null)}
          title="Delete Course"
          description="Are you sure you want to delete this course? This action will cascade to all associated modules and cannot be undone."
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
        />
      </DashboardShell>
    </RequirePermission>
  );
}
