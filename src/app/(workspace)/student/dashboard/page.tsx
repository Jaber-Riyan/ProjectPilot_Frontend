"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, ClipboardCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/feedback/status-badge";
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { useSession } from "@/hooks/use-session";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useAssignments } from "@/features/assignments/hooks/use-assignments";
import { useSubmissions } from "@/features/submissions/hooks/use-submissions";

export default function StudentDashboardPage() {
  const { user } = useSession();
  const { data: coursesData } = useCourses({ limit: 3 });
  const { data: assignmentsData } = useAssignments({ limit: 3 });
  const { data: submissionsData } = useSubmissions({ limit: 5 });

  const courses = coursesData?.items ?? [];
  const submissions = submissionsData?.items ?? [];

  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;

  return (
    <RequirePermission permission={PERMISSIONS.DASHBOARD_VIEW}>
      <DashboardShell role="student">
        <PageHeader
          title={`Welcome back, ${user?.name || "Student"}!`}
          description="Track your course progression, upcoming assignment milestones, and submission feedback."
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Available Courses</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand-600">
                <BookOpen size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{coursesData?.total ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Ready for study</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Assignments</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <GraduationCap size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{assignmentsData?.total ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Published coursework</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Submissions</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-purple-50 text-purple-600">
                <ClipboardCheck size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{submissionsData?.total ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Attempt records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Completed & Approved</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{approvedCount}</div>
              <p className="text-xs text-slate-500 mt-1">Passing reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid: Recent Submissions & Course Catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submissions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Your Recent Submissions</h2>
                <p className="text-xs text-slate-500">History of your latest coursework submissions</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link href="/submissions">
                  View all <ArrowRight size={14} />
                </Link>
              </Button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {submissions.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">No submissions yet.</p>
              ) : (
                submissions.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/submissions/${sub.id}`}
                    className="flex items-center justify-between py-3.5 hover:bg-slate-50 px-2 rounded-xl transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          Attempt #{sub.attemptNumber}
                        </span>
                        <StatusBadge status={sub.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Submitted on {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {sub.score !== undefined && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {sub.score}%
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Courses */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Featured Courses</h2>
                <p className="text-xs text-slate-500">Start learning with comprehensive modules</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link href="/courses">
                  Browse all <ArrowRight size={14} />
                </Link>
              </Button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {courses.map((course) => (
                <div key={course.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/courses/${course.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition"
                      >
                        {course.title}
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>{course.estimatedHours} Hours</span>
                        <span>•</span>
                        <span>{course.level}</span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 text-xs">
                      <Link href={`/courses/${course.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardShell>
    </RequirePermission>
  );
}
