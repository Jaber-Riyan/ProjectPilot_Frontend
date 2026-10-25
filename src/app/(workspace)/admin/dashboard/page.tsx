"use client";

import Link from "next/link";
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/feedback/status-badge";
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { useSession } from "@/hooks/use-session";
import { useAdminDashboard } from "@/features/dashboard/hooks/use-dashboard";

export default function AdminDashboardPage() {
  const { user } = useSession();
  const { data: dashboard, isLoading } = useAdminDashboard();

  const totalUsers = dashboard?.users?.total ?? 0;
  const totalCourses = dashboard?.courses?.total ?? 0;
  const totalAssignments = dashboard?.assignments?.total ?? 0;
  const totalSubmissions = dashboard?.submissions?.total ?? 0;
  const pendingReviews = dashboard?.submissions?.pendingReviewTotal ?? 0;

  const recentUsers = dashboard?.recentActivity?.recentUsers ?? [];
  const recentSubmissions = dashboard?.recentActivity?.recentSubmissions ?? [];

  return (
    <RequirePermission permission={PERMISSIONS.DASHBOARD_VIEW}>
      <DashboardShell role="admin">
        <PageHeader
          title={`Administrator Portal — ${user?.name || "Admin"}`}
          description="Global system administration, course catalog governance, user access management, and cross-platform oversight."
        />

        {/* Global Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <Users size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalUsers}</div>
              <p className="text-xs text-slate-500 mt-1">
                {dashboard?.users?.byRole?.STUDENT ?? 0} students • {dashboard?.users?.byRole?.MENTOR ?? 0} mentors • {dashboard?.users?.byRole?.ADMIN ?? 0} admins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">All Courses</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand-600">
                <BookOpen size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalCourses}</div>
              <p className="text-xs text-slate-500 mt-1">
                {dashboard?.courses?.published ?? 0} published • {dashboard?.courses?.draft ?? 0} draft
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Coursework & Modules</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-purple-50 text-purple-600">
                <GraduationCap size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalAssignments}</div>
              <p className="text-xs text-slate-500 mt-1">
                {dashboard?.assignments?.published ?? 0} published assignments • {dashboard?.modules?.total ?? 0} modules
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Submissions</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <ClipboardCheck size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalSubmissions}</div>
              <p className="text-xs text-amber-700 font-medium mt-1">
                {pendingReviews} awaiting evaluation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Administration Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card flex flex-col">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-brand-700 mb-4">
              <BookOpen size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Course Catalog Management</h3>
            <p className="text-xs text-slate-500 mt-1 flex-1">
              Create, review, publish, and delete courses. Manage mentor assignments and curriculum structures.
            </p>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">{totalCourses} Courses</span>
              <Button asChild size="sm" variant="outline" className="gap-1 text-xs">
                <Link href="/courses">
                  Manage <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card flex flex-col">
            <div className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-700 mb-4">
              <ClipboardCheck size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Global Submissions Oversight</h3>
            <p className="text-xs text-slate-500 mt-1 flex-1">
              Oversee learner attempts across all mentors and courses. Inspect grading outcomes and feedback.
            </p>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">{totalSubmissions} Submissions</span>
              <Button asChild size="sm" variant="outline" className="gap-1 text-xs">
                <Link href="/submissions">
                  Inspect <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card flex flex-col">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 mb-4">
              <UserCheck size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">User Access & Governance</h3>
            <p className="text-xs text-slate-500 mt-1 flex-1">
              Manage student, mentor, and administrator records. Modify active statuses and access levels.
            </p>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">{totalUsers} Users</span>
              <Button asChild size="sm" variant="outline" className="gap-1 text-xs">
                <Link href="/users">
                  Manage <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Platform Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Submissions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent Platform Submissions</h2>
                <p className="text-xs text-slate-500">Cross-platform student attempts</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link href="/submissions">
                  View all <ArrowRight size={14} />
                </Link>
              </Button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {isLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading submissions...</div>
              ) : recentSubmissions.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">No submissions recorded.</p>
              ) : (
                recentSubmissions.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/submissions/${sub.id}`}
                          className="text-xs font-semibold text-slate-900 hover:text-brand-600 transition"
                        >
                          {sub.assignment?.title || sub.projectName}
                        </Link>
                        <StatusBadge status={sub.status} />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sub.student?.name} • Attempt #{sub.attemptNumber} • {new Date(sub.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                      <Link href={`/submissions/${sub.id}`}>Inspect</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent User Registrations</h2>
                <p className="text-xs text-slate-500">Newly onboarded platform accounts</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link href="/users">
                  Directory <ArrowRight size={14} />
                </Link>
              </Button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {isLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading users...</div>
              ) : recentUsers.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">No users found.</p>
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={u.role} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    </RequirePermission>
  );
}
