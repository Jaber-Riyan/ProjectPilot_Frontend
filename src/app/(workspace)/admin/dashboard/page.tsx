"use client";

import Link from "next/link";
import { Users, BookOpen, GraduationCap, ClipboardCheck, ArrowRight, UserCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { useSession } from "@/hooks/use-session";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useAssignments } from "@/features/assignments/hooks/use-assignments";
import { useSubmissions } from "@/features/submissions/hooks/use-submissions";
import { useUsers } from "@/features/users/hooks/use-users";

export default function AdminDashboardPage() {
  const { user } = useSession();
  const { data: coursesData } = useCourses();
  const { data: assignmentsData } = useAssignments();
  const { data: submissionsData } = useSubmissions();
  const { data: usersData } = useUsers();

  const totalUsers = usersData?.total ?? 0;
  const totalCourses = coursesData?.total ?? 0;
  const totalAssignments = assignmentsData?.total ?? 0;
  const totalSubmissions = submissionsData?.total ?? 0;

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
              <p className="text-xs text-slate-500 mt-1">Students, mentors, admins</p>
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
              <p className="text-xs text-slate-500 mt-1">Draft, published, archived</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Platform Assignments</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-purple-50 text-purple-600">
                <GraduationCap size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalAssignments}</div>
              <p className="text-xs text-slate-500 mt-1">Curriculum assessments</p>
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
              <p className="text-xs text-slate-500 mt-1">Global attempts across courses</p>
            </CardContent>
          </Card>
        </div>

        {/* Administration Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <h3 className="text-base font-semibold text-slate-900">Global Submissions & Reviews</h3>
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
            <h3 className="text-base font-semibold text-slate-900">User Access & Roles</h3>
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
      </DashboardShell>
    </RequirePermission>
  );
}
