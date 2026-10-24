"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, ClipboardCheck, Clock, Plus, ArrowRight } from "lucide-react";
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

export default function MentorDashboardPage() {
  const { user } = useSession();
  const { data: coursesData } = useCourses();
  const { data: assignmentsData } = useAssignments();
  const { data: submissionsData } = useSubmissions();

  const courses = coursesData?.items ?? [];
  const submissions = submissionsData?.items ?? [];

  const pendingSubmissions = submissions.filter(
    (s) => s.status === "PENDING" || s.status === "UNDER_REVIEW"
  );
  const reviewedSubmissions = submissions.filter((s) => s.status === "APPROVED" || s.status === "REJECTED");

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
              <div className="text-2xl font-bold text-amber-950">{pendingSubmissions.length}</div>
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
              <div className="text-2xl font-bold text-slate-900">{courses.length}</div>
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
              <div className="text-2xl font-bold text-slate-900">{assignmentsData?.total ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Active assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Evaluated</CardTitle>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <ClipboardCheck size={16} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{reviewedSubmissions.length}</div>
              <p className="text-xs text-slate-500 mt-1">Completed reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Priority Review Queue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Priority Review Queue</h2>
              <p className="text-xs text-slate-500">Student submissions scoped to your assigned courses</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/submissions">
                View all queue <ArrowRight size={14} />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {pendingSubmissions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Your queue is clear! All assigned submissions have been reviewed.
              </p>
            ) : (
              pendingSubmissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Submission #{sub.id.slice(-6)}
                      </span>
                      <StatusBadge status={sub.status} />
                      <span className="text-xs text-slate-400">Attempt #{sub.attemptNumber}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted on {new Date(sub.submittedAt).toLocaleDateString()} by Student{" "}
                      <code className="text-slate-600 font-mono">{sub.studentId}</code>
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/submissions/${sub.id}`}>Review</Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Courses List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Your Assigned Courses</h2>
              <p className="text-xs text-slate-500">Courses you have permission to edit and manage modules for</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/courses">
                Course Catalog <ArrowRight size={14} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {courses.map((course) => (
              <div key={course.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${course.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition truncate"
                      >
                        {course.title}
                      </Link>
                      <StatusBadge status={course.status} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{course.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
                  <span>{course.moduleIds.length} Modules</span>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                      <Link href={`/courses/${course.id}/modules`}>Modules</Link>
                    </Button>
                    <Button asChild size="sm" className="h-7 text-xs">
                      <Link href={`/courses/${course.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardShell>
    </RequirePermission>
  );
}
