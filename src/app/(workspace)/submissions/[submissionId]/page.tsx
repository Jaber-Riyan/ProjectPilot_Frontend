"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Award,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Github,
  Globe,
  FileCode,
  AlertCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/feedback/status-badge";
import { DetailLoadingSkeleton } from "@/components/feedback/loading-state";
import { AccessDenied } from "@/components/access/access-denied";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/submit-button";
import { usePermissions } from "@/hooks/use-permissions";
import { useSubmission } from "@/features/submissions/hooks/use-submissions";
import { useAssignment } from "@/features/assignments/hooks/use-assignments";
import {
  useReviewBySubmission,
  useCreateReview,
} from "@/features/reviews/hooks/use-reviews";
import {
  reviewSchema,
  type ReviewFormValues,
} from "@/features/reviews/schemas/review.schema";

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const resolvedParams = use(params);
  const submissionId = resolvedParams.submissionId;
  const { isMentor, isAdmin } = usePermissions();

  const { data: submission, isLoading, isError, error, refetch: refetchSubmission } =
    useSubmission(submissionId);
  const { data: assignment } = useAssignment(submission?.assignmentId ?? "");
  const { data: existingReview, refetch: refetchReview } =
    useReviewBySubmission(submissionId);

  const createReviewMutation = useCreateReview();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      submissionId,
      status: "APPROVED",
      feedback: "",
      score: 90,
    },
  });

  useEffect(() => {
    if (existingReview) {
      const reviewStatus = (
        existingReview.status === "PENDING" ? "UNDER_REVIEW" : existingReview.status
      ) as "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RESUBMISSION_REQUESTED";

      reset({
        submissionId,
        status: reviewStatus,
        feedback: existingReview.feedback || "",
        score: existingReview.score ?? 90,
      });
    } else if (submission) {
      const subStatus = (
        submission.status === "PENDING" ? "APPROVED" : submission.status
      ) as "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RESUBMISSION_REQUESTED";

      reset({
        submissionId,
        status: subStatus,
        feedback: "",
        score: submission.score ?? 85,
      });
    }
  }, [existingReview, submission, submissionId, reset]);

  if (isLoading) {
    return (
      <DashboardShell>
        <DetailLoadingSkeleton />
      </DashboardShell>
    );
  }

  if (isError || !submission) {
    return (
      <DashboardShell>
        <AccessDenied
          title="Submission Inaccessible"
          description={
            error instanceof Error
              ? error.message
              : "You do not have permission to view this submission or it does not exist."
          }
        />
      </DashboardShell>
    );
  }

  const isOneTimePolicy =
    submission.assignment?.submissionPolicy === "ONE_TIME" ||
    assignment?.submissionPolicy === "ONE_TIME";

  const onSubmitReview = (values: ReviewFormValues) => {
    createReviewMutation.mutate(
      {
        submissionId: submission.id,
        feedback: values.feedback || "",
        status: values.status,
        score: values.score,
      },
      {
        onSuccess: () => {
          refetchReview();
          refetchSubmission();
        },
      }
    );
  };

  const feedbacks = submission.feedbacks && submission.feedbacks.length > 0
    ? submission.feedbacks
    : existingReview
    ? [
        {
          id: existingReview.id,
          submissionId: existingReview.submissionId,
          mentorId: existingReview.reviewerId,
          comment: existingReview.feedback,
          createdAt: existingReview.createdAt,
          updatedAt: existingReview.updatedAt,
        },
      ]
    : [];

  return (
    <DashboardShell>
      <PageHeader
        title={submission.projectName || `Submission #${submission.id.slice(-6)}`}
        description={
          assignment
            ? `Attempt #${submission.attemptNumber} for challenge "${assignment.title}"`
            : `Attempt #${submission.attemptNumber}`
        }
        breadcrumbs={[
          { label: "Submissions", href: "/submissions" },
          { label: `Attempt #${submission.attemptNumber}` },
        ]}
        badge={<StatusBadge status={submission.status} />}
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/submissions">
              <ArrowLeft size={15} /> Back to Submissions
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Submission Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCode size={18} className="text-brand-600" />
                  Student Deliverables
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={13} />
                  <span>Submitted {new Date(submission.submittedAt).toLocaleString()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Deliverable links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {submission.repoUrl ? (
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Github size={18} className="text-slate-700 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900">Repository Link</p>
                        <p className="text-[11px] text-slate-500 truncate">{submission.repoUrl}</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-700 shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-400">
                    No repository link provided.
                  </div>
                )}

                {submission.liveUrl ? (
                  <a
                    href={submission.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/50 hover:border-emerald-300 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Globe size={18} className="text-emerald-700 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-emerald-950">Live Deployment</p>
                        <p className="text-[11px] text-emerald-700 truncate">{submission.liveUrl}</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-emerald-500 group-hover:text-emerald-800 shrink-0" />
                  </a>
                ) : null}
              </div>

              {/* Description / Summary */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Solution Notes & Documentation
                </p>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {submission.description || submission.answerText || "No textual answer or notes provided."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Timeline */}
          <Card>
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare size={17} className="text-brand-600" />
                  Review & Feedback History
                </CardTitle>
                {submission.score !== undefined && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Score: {submission.score}%
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks.map((fb, idx) => (
                    <div
                      key={fb.id || idx}
                      className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">
                          {fb.mentor?.name || `Mentor Reviewer`}
                        </span>
                        <span>{new Date(fb.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                        {fb.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 flex items-center gap-2">
                  <Clock size={16} className="text-amber-600 shrink-0" />
                  <span>
                    This submission is currently pending review. Feedback and status decisions will appear here once evaluation is conducted.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evaluation Form for Mentors and Admins */}
          {(isMentor || isAdmin) && (
            <Card className="border-brand-200">
              <CardHeader className="border-b border-slate-100 bg-blue-50/40">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award size={18} className="text-brand-600" /> Evaluation & Grading Decision
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Evaluation Outcome" error={errors.status?.message}>
                      <Select {...register("status")}>
                        <option value="APPROVED">Approved (Passing)</option>
                        <option value="REJECTED">Needs Revision (Rejected)</option>
                        {!isOneTimePolicy && (
                          <option value="RESUBMISSION_REQUESTED">
                            Resubmission Requested
                          </option>
                        )}
                        <option value="UNDER_REVIEW">Mark Under Review</option>
                      </Select>
                    </FormField>

                    <FormField label="Points / Score (0-100)" error={errors.score?.message}>
                      <Input type="number" min={0} max={100} {...register("score")} />
                    </FormField>
                  </div>

                  <FormField
                    label="Mentor Feedback & Guidance"
                    required
                    error={errors.feedback?.message}
                    description="Provide constructive feedback. Required when rejecting or requesting resubmissions."
                  >
                    <Textarea
                      {...register("feedback")}
                      rows={5}
                      placeholder="e.g. Excellent work on the API client error handling. Consider validating schema constraints on..."
                    />
                  </FormField>

                  {createReviewMutation.isError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>
                        {createReviewMutation.error instanceof Error
                          ? createReviewMutation.error.message
                          : "Failed to apply review decision."}
                      </span>
                    </div>
                  )}

                  {createReviewMutation.isSuccess && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Review and evaluation decision saved successfully!
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <SubmitButton
                      isLoading={createReviewMutation.isPending}
                      loadingText="Saving Decision..."
                    >
                      {existingReview ? "Update Evaluation" : "Submit Evaluation Decision"}
                    </SubmitButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Context & Assignment Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Learner Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Student Name</span>
                <span className="font-semibold text-slate-800">
                  {submission.student?.name || "Student"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student Email</span>
                <span className="font-mono text-slate-700">
                  {submission.student?.email || submission.studentId.slice(0, 12)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attempt Number</span>
                <span className="font-semibold">Attempt #{submission.attemptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status</span>
                <StatusBadge status={submission.status} />
              </div>
              {submission.reviewedBy && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Reviewed By</span>
                  <span className="font-semibold text-slate-800">
                    {submission.reviewedBy.name || submission.reviewedBy.email}
                  </span>
                </div>
              )}
              {submission.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Evaluated Date</span>
                  <span>{new Date(submission.reviewedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {assignment && (
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Associated Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3 text-xs text-slate-600">
                <div>
                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="font-semibold text-brand-700 hover:underline text-sm block"
                  >
                    {assignment.title}
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {assignment.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between">
                  <span className="text-slate-400">Max Score</span>
                  <span className="font-semibold">{assignment.maxScore} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submission Policy</span>
                  <span className="font-semibold">
                    {assignment.submissionPolicy === "ONE_TIME"
                      ? "Single Attempt Only"
                      : "Resubmittable"}
                  </span>
                </div>
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="w-full text-xs">
                    <Link href={`/assignments/${assignment.id}`}>
                      View Full Assignment →
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
