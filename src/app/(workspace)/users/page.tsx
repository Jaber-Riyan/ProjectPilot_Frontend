"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, Calendar } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/tables/filter-bar";
import { DataTable, type Column } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import { StatusBadge } from "@/components/feedback/status-badge";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { useUsers } from "@/features/users/hooks/use-users";
import type { User } from "@/types/domain";

export default function UsersManagementPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useUsers({
    page,
    limit: 10,
    search: search || undefined,
    role: roleFilter === "ALL" ? undefined : roleFilter,
  });

  const columns: Column<User>[] = [
    {
      header: "User",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            {user.name.charAt(0)}
          </div>
          <div>
            <Link
              href={`/users/${user.id}`}
              className="font-semibold text-slate-900 hover:text-brand-600 transition"
            >
              {user.name}
            </Link>
            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "System Role",
      cell: (user) => <StatusBadge status={user.role} />,
    },
    {
      header: "Status",
      cell: (user) => <StatusBadge status={user.status} />,
    },
    {
      header: "Created Date",
      cell: (user) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={13} className="text-slate-400" />
          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      headerClassName: "text-right",
      cell: (user) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1">
            <Link href={`/users/${user.id}`}>
              <Edit3 size={13} /> Edit Access
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RequirePermission permission={PERMISSIONS.USER_READ}>
      <DashboardShell>
        <PageHeader
          title="User Directory & Access Governance"
          description="Manage user directory, monitor platform activity, and adjust student, mentor, and administrator permissions."
        />

        <FilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search users by name or email..."
          statusFilter={roleFilter}
          onStatusChange={(val) => {
            setRoleFilter(val);
            setPage(1);
          }}
          statusOptions={[
            { label: "All Roles", value: "ALL" },
            { label: "Students", value: "STUDENT" },
            { label: "Mentors", value: "MENTOR" },
            { label: "Admins", value: "ADMIN" },
          ]}
        />

        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          emptyTitle="No users found"
          emptyDescription="There are no users matching the current filter."
        />

        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          limit={data?.limit ?? 10}
          onPageChange={setPage}
        />
      </DashboardShell>
    </RequirePermission>
  );
}
