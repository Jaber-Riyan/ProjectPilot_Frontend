"use client";

import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Clock,
  Plus,
  ArrowRight,
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
import { useMentorDashboard, useMentorCourses } from "@/features/dashboard/hooks/use-dashboard";

export default function MentorDashboardPage() {
  const { user } = useSession();
  const { data: dashboard, isLoading } = useMentorDashboard();
  const { data: coursesData } = useMentorCourses({ limit: 4 });

  const overview = dashboard?.overview;
  const recentSubmissions = dashboard?.recentSubmissions ?? [];
  const recentReviews = dashboard?.recentReviews ?? [];
  const authoredCourses = coursesData?.items ?? [];

  return (
    <RequirePermission permission={PERMISSIONS.DASHBOARD_VIEW}>
      <DashboardShell role="mentor">
        <PageHeader
          title={`Mentor Workspace — ${user?.name || "Mentor"}`}
          description="Manage assigned curriculum, evaluate student submissions, and provide actionable feedback."
          actions={
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href="/assignments/new">
                  <Plus size={15} /> New Assignment
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/courses/new">
                  <Plus size={15} /> Create Course
                </Link>
              </Button>
            </div>
          }
        />

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Pending Reviews</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <Clock size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-950">
                {overview?.pendingReviewsCount ?? 0}
              </div>
              <p className="text-xs text-amber-700 mt-1">Awaiting mentor evaluation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Assigned Courses</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand-600">
                <BookOpen size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {overview?.manageableCoursesCount ?? authoredCourses.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Under your instruction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Coursework Assignments</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-purple-50 text-purple-600">
                <GraduationCap size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {overview?.manageableAssignmentsCount ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Authored assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Evaluations Given</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <ClipboardCheck size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {overview?.reviewedSubmissionsCount ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {overview?.totalFeedbacksGiven ?? 0} total feedbacks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Priority Review Queue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Priority Review Queue</h2>
              <p className="text-xs text-slate-500">Student submissions scoped to your authored courses & assignments</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/submissions">
                View all queue <ArrowRight size={14} />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading review queue...</div>
            ) : recentSubmissions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No pending submissions requiring evaluation at this time.
              </p>
            ) : (
              recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3.5 gap-2 hover:bg-slate-50 px-2 rounded-xl transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/submissions/${sub.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition"
                      >
                        {sub.assignment?.title || sub.projectName || `Attempt #${sub.attemptNumber}`}
                      </Link>
                      <StatusBadge status={sub.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Student: <strong className="text-slate-700">{sub.student?.name || sub.student?.email}</strong></span>
                      <span>•</span>
                      <span>Attempt #{sub.attemptNumber}</span>
                      <span>•</span>
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="shrink-0 text-xs">
                    <Link href={`/submissions/${sub.id}`}>Evaluate Attempt</Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Authored Courses & Recent Review Feedback Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authored Courses */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Authored Courses</h2>
                <p className="text-xs text-slate-500">Curricula you have created</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link href="/courses">
                  Manage all <ArrowRight size={14} />
                </Link>
              </Button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {authoredCourses.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  No courses authored yet. Click &quot;Create Course&quot; to begin.
                </p>
              ) : (
                authoredCourses.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/courses/${c.id}`}
                        className="text-xs font-semibold text-slate-900 hover:text-brand-600 transition"
                      >
                        {c.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {c.modulesCount} modules • {c.isPublished ? "Published" : "Draft"}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                      <Link href={`/courses/${c.id}/modules`}>Modules</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Evaluations & Feedbacks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Your Recent Feedbacks</h2>
                <p className="text-xs text-slate-500">Guidance delivered to students</p>
              </div>
              <Award size={16} className="text-brand-600" />
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentReviews.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  No evaluations recorded yet.
                </p>
              ) : (
                recentReviews.map((r) => (
                  <div key={r.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">
                        {r.submission?.assignment?.title || "Assignment"}
                      </span>
                      <StatusBadge status={r.submission?.status || "APPROVED"} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Student: {r.submission?.student?.name}
                    </div>
                    <div className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 border border-slate-100 flex items-start gap-1.5">
                      <MessageSquare size={13} className="text-brand-600 shrink-0 mt-0.5" />
                      <span className="italic line-clamp-2">&ldquo;{r.comment}&rdquo;</span>
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
