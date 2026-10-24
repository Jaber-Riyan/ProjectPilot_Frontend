"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Award,
  Edit3,
  Trash2,
  Send,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/feedback/status-badge";
import { DetailLoadingSkeleton } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/forms/submit-button";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useAssignment,
  useDeleteAssignment,
} from "@/features/assignments/hooks/use-assignments";
import {
  useSubmissions,
  useSubmissionAttempts,
  useCreateSubmission,
} from "@/features/submissions/hooks/use-submissions";
import {
  submissionSchema,
  type SubmissionFormValues,
} from "@/features/submissions/schemas/submission.schema";

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.assignmentId;
  const router = useRouter();
  const { user, isStudent, isMentor, isAdmin } = usePermissions();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: assignment, isLoading, isError, error } = useAssignment(assignmentId);
  const deleteMutation = useDeleteAssignment();

  // Student attempts query
  const { data: attempts = [], refetch: refetchAttempts } = useSubmissionAttempts(
    assignmentId,
    user?.id ?? ""
  );

  // Mentor / Admin submissions query for this assignment
  const { data: allAssignmentSubmissions } = useSubmissions({
    assignmentId,
    limit: 50,
  });

  const createSubmissionMutation = useCreateSubmission();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      assignmentId,
      answerText: "",
      attachmentUrl: "",
    },
  });

  if (isLoading) {
    return (
      <DashboardShell>
        <DetailLoadingSkeleton />
      </DashboardShell>
    );
  }

  if (isError || !assignment) {
    return (
      <DashboardShell>
        <ErrorState
          title="Assignment not found"
          message={error instanceof Error ? error.message : "This assignment is not accessible."}
          onRetry={() => router.push("/assignments")}
        />
      </DashboardShell>
    );
  }

  const handleDelete = () => {
    deleteMutation.mutate(assignment.id, {
      onSuccess: () => {
        router.push("/assignments");
      },
    });
  };

  const onSubmitSubmission = (values: SubmissionFormValues) => {
    createSubmissionMutation.mutate(
      {
        assignmentId: assignment.id,
        answerText: values.answerText,
        attachmentUrls: values.attachmentUrl ? [values.attachmentUrl] : [],
      },
      {
        onSuccess: () => {
          reset();
          refetchAttempts();
        },
      }
    );
  };

  const hasReachedAttemptLimit =
    assignment.submissionPolicy === "ONE_TIME" && attempts.length >= 1;

  return (
    <DashboardShell>
      <PageHeader
        title={assignment.title}
        description={assignment.description}
        breadcrumbs={[
          { label: "Assignments", href: "/assignments" },
          { label: assignment.title },
        ]}
        badge={<StatusBadge status={assignment.status} />}
        actions={
          <div className="flex items-center gap-2">
            {(isAdmin || isMentor) && (
              <>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link href={`/assignments/${assignment.id}/edit`}>
                    <Edit3 size={15} /> Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={15} />
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Meta Specs */}
      <div className="flex flex-wrap items-center gap-4 py-3 px-5 mb-8 rounded-2xl border border-slate-200 bg-white shadow-card text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Calendar size={15} className="text-slate-400" />
          <span>
            Due Date:{" "}
            <strong>
              {assignment.dueDate
                ? new Date(assignment.dueDate).toLocaleDateString()
                : "Open / No Deadline"}
            </strong>
          </span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Award size={15} className="text-slate-400" />
          <span>Maximum Score: <strong>{assignment.maxScore} pts</strong></span>
        </div>
        <span className="text-slate-300">•</span>
        <div>
          <Badge variant={assignment.submissionPolicy === "ONE_TIME" ? "warning" : "secondary"}>
            {assignment.submissionPolicy === "ONE_TIME" ? "Single Attempt Only" : "Resubmissions Allowed"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Instructions & Challenge Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {assignment.instructions}
              </div>
            </CardContent>
          </Card>

          {/* Student Attempt History */}
          {isStudent && (
            <Card>
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900">
                    Your Submission History ({attempts.length} {attempts.length === 1 ? "attempt" : "attempts"})
                  </CardTitle>
                  {hasReachedAttemptLimit && (
                    <Badge variant="warning">Max Attempts Reached</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {attempts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500">
                    You have not submitted an attempt for this assignment yet.
                  </p>
                ) : (
                  attempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Attempt #{attempt.attemptNumber}
                          </span>
                          <StatusBadge status={attempt.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{new Date(attempt.submittedAt).toLocaleString()}</span>
                          {attempt.score !== undefined && (
                            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Score: {attempt.score}%
                            </span>
                          )}
                        </div>
                      </div>

                      {attempt.answerText && (
                        <p className="text-xs text-slate-700 mt-2 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-line">
                          {attempt.answerText}
                        </p>
                      )}

                      {attempt.attachmentUrls && attempt.attachmentUrls.length > 0 && (
                        <div className="pt-1">
                          <a
                            href={attempt.attachmentUrls[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline"
                          >
                            <ExternalLink size={12} /> View Submission Attachment
                          </a>
                        </div>
                      )}

                      <div className="pt-2 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                          <Link href={`/submissions/${attempt.id}`}>
                            View Feedback Details →
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Mentor / Admin Submissions View */}
          {(isMentor || isAdmin) && (
            <Card>
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Student Submissions ({allAssignmentSubmissions?.total ?? 0})
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submissions received from enrolled students for this challenge
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link href="/submissions">All Submissions</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 divide-y divide-slate-100">
                {allAssignmentSubmissions?.items.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    No student submissions recorded for this assignment yet.
                  </p>
                ) : (
                  allAssignmentSubmissions?.items.map((sub) => (
                    <div key={sub.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            Student {sub.studentId}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            (Attempt #{sub.attemptNumber})
                          </span>
                          <StatusBadge status={sub.status} />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                        <Link href={`/submissions/${sub.id}`}>Review</Link>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Submission Form (Students) or Assignment Stats (Mentors) */}
        <div>
          {isStudent && (
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Submit Your Work
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {hasReachedAttemptLimit ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-5">
                    <strong>Single Attempt Policy:</strong> This assignment does not permit resubmissions once an attempt has been delivered.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmitSubmission)} className="space-y-4">
                    <FormField
                      label="Submission Answer / Summary"
                      required
                      error={errors.answerText?.message}
                      description="Explain your solution, architectural decisions, and how you met the criteria."
                    >
                      <Textarea
                        {...register("answerText")}
                        rows={5}
                        placeholder="Detailed explanation of your work..."
                      />
                    </FormField>

                    <FormField
                      label="Project / Repository URL"
                      error={errors.attachmentUrl?.message}
                      description="Optional link to your GitHub repo, deployment, or design doc."
                    >
                      <Input
                        {...register("attachmentUrl")}
                        placeholder="https://github.com/username/project"
                      />
                    </FormField>

                    {createSubmissionMutation.isError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {createSubmissionMutation.error instanceof Error
                          ? createSubmissionMutation.error.message
                          : "Failed to submit assignment."}
                      </div>
                    )}

                    {createSubmissionMutation.isSuccess && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 size={15} /> Submission received! A mentor will review your work.
                      </div>
                    )}

                    <SubmitButton
                      className="w-full gap-2"
                      isLoading={createSubmissionMutation.isPending}
                      loadingText="Submitting..."
                    >
                      <Send size={15} />
                      {attempts.length > 0 ? "Submit Resubmission" : "Submit Assignment"}
                    </SubmitButton>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {!isStudent && (
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Assignment Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Created By</span>
                  <span className="font-semibold text-slate-800">{assignment.createdById}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Created Date</span>
                  <span>{new Date(assignment.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submissions Policy</span>
                  <span className="font-semibold">{assignment.submissionPolicy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Attempts Recorded</span>
                  <span className="font-semibold text-slate-900">
                    {allAssignmentSubmissions?.total ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Assignment"
        description={`Are you sure you want to permanently delete "${assignment.title}"?`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </DashboardShell>
  );
}
