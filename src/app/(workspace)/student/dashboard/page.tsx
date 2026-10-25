"use client";

import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  MessageSquare,
  Award,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/feedback/status-badge";
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { useSession } from "@/hooks/use-session";
import { useStudentDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { useCourses } from "@/features/courses/hooks/use-courses";

export default function StudentDashboardPage() {
  const { user } = useSession();
  const { data: dashboard, isLoading } = useStudentDashboard();
  const { data: coursesData } = useCourses({ limit: 3 });

  const overview = dashboard?.overview;
  const recentSubmissions = dashboard?.recentSubmissions ?? [];
  const courses = coursesData?.items ?? [];

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
              <div className="text-2xl font-bold text-slate-900">
                {overview?.accessibleCoursesCount ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Open learning catalog</p>
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
              <div className="text-2xl font-bold text-slate-900">
                {overview?.accessibleAssignmentsCount ?? 0}
              </div>
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
              <div className="text-2xl font-bold text-slate-900">
                {overview?.totalSubmissionsCount ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {overview?.pendingReviewsCount ?? 0} pending mentor review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Completion Rate</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">
                {overview?.completionRate ?? 0}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {overview?.completedAssignmentsCount ?? 0} completed & approved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown Bar */}
        {dashboard?.submissionsByStatus && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Submission Pipeline Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500">Pending Review</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {dashboard.submissionsByStatus.PENDING}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="text-xs text-blue-700">Under Review</div>
                <div className="text-lg font-bold text-blue-900 mt-0.5">
                  {dashboard.submissionsByStatus.UNDER_REVIEW}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="text-xs text-emerald-700">Approved</div>
                <div className="text-lg font-bold text-emerald-900 mt-0.5">
                  {dashboard.submissionsByStatus.APPROVED}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="text-xs text-amber-700">Resubmission Req.</div>
                <div className="text-lg font-bold text-amber-900 mt-0.5">
                  {dashboard.submissionsByStatus.RESUBMISSION_REQUESTED}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-50/50 border border-red-100">
                <div className="text-xs text-red-700">Rejected</div>
                <div className="text-lg font-bold text-red-900 mt-0.5">
                  {dashboard.submissionsByStatus.REJECTED}
                </div>
              </div>
            </div>
          </div>
        )}

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
              {isLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading submissions...</div>
              ) : recentSubmissions.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">No submissions yet.</p>
              ) : (
                recentSubmissions.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/submissions/${sub.id}`}
                    className="flex flex-col py-3.5 hover:bg-slate-50 px-2.5 rounded-xl transition gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {sub.assignment?.title || sub.projectName || `Attempt #${sub.attemptNumber}`}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          #{sub.attemptNumber}
                        </span>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={12} />
                        <span>Submitted {new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                      {sub.reviewedBy && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Award size={12} className="text-brand-600" />
                          <span>Reviewed by {sub.reviewedBy.name}</span>
                        </div>
                      )}
                    </div>

                    {sub.latestFeedback && (
                      <div className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 border border-slate-100 flex items-start gap-1.5">
                        <MessageSquare size={13} className="text-brand-600 shrink-0 mt-0.5" />
                        <span className="italic line-clamp-1">&ldquo;{sub.latestFeedback.comment}&rdquo;</span>
                      </div>
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
