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
  const { isStudent, isMentor, isAdmin } = usePermissions();

  const { data: submission, isLoading, isError, error } = useSubmission(submissionId);
  const { data: assignment } = useAssignment(submission?.assignmentId ?? "");
  const { data: existingReview, refetch: refetchReview } = useReviewBySubmission(submissionId);

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
        feedback: existingReview.feedback,
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

  const onSubmitReview = (values: ReviewFormValues) => {
    createReviewMutation.mutate(
      {
        submissionId: submission.id,
        feedback: values.feedback,
        status: values.status,
        score: values.score,
      },
      {
        onSuccess: () => {
          refetchReview();
        },
      }
    );
  };

  return (
    <DashboardShell>
      <PageHeader
        title={`Submission #${submission.id.slice(-6)}`}
        description={
          assignment
            ? `Attempt #${submission.attemptNumber} for assignment "${assignment.title}"`
            : `Attempt #${submission.attemptNumber}`
        }
        breadcrumbs={[
          { label: "Submissions", href: "/submissions" },
          { label: `Submission #${submission.id.slice(-6)}` },
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
                <CardTitle className="text-base font-bold text-slate-900">
                  Student Solution & Deliverables
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={13} />
                  <span>Submitted {new Date(submission.submittedAt).toLocaleString()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Answer Summary
                </p>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {submission.answerText || "No textual answer provided."}
                </p>
              </div>

              {submission.attachmentUrls && submission.attachmentUrls.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Deliverable Attachments
                  </p>
                  <ul className="space-y-1.5">
                    {submission.attachmentUrls.map((url, idx) => (
                      <li key={idx}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
                        >
                          <ExternalLink size={13} /> {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Review / Feedback display for Students */}
          {isStudent && (
            <Card>
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare size={17} className="text-brand-600" /> Mentor Feedback
                  </CardTitle>
                  {submission.score !== undefined && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Score: {submission.score}%
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {existingReview ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Evaluated on {new Date(existingReview.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Reviewer: <code className="font-mono">{existingReview.reviewerId}</code></span>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {existingReview.feedback}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 flex items-center gap-2">
                    <Clock size={16} className="text-amber-600 shrink-0" />
                    <span>Your submission is currently pending review by a mentor. Feedback and grades will appear here once evaluation is complete.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review Form for Mentors and Admins */}
          {(isMentor || isAdmin) && (
            <Card className="border-brand-200">
              <CardHeader className="border-b border-slate-100 bg-blue-50/40">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award size={18} className="text-brand-600" /> Evaluation & Grading Form
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Evaluation Outcome" error={errors.status?.message}>
                      <Select {...register("status")}>
                        <option value="APPROVED">Approved (Passing)</option>
                        <option value="REJECTED">Needs Revision (Rejected)</option>
                        <option value="RESUBMISSION_REQUESTED">Resubmission Requested</option>
                        <option value="UNDER_REVIEW">Under Review</option>
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
                    description="Provide constructive feedback highlighting strengths and required improvements."
                  >
                    <Textarea
                      {...register("feedback")}
                      rows={5}
                      placeholder="e.g. Excellent work on the route matching logic. Consider adding edge cases for..."
                    />
                  </FormField>

                  {createReviewMutation.isError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {createReviewMutation.error instanceof Error
                        ? createReviewMutation.error.message
                        : "Failed to save review."}
                    </div>
                  )}

                  {createReviewMutation.isSuccess && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Review and evaluation saved successfully!
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <SubmitButton
                      isLoading={createReviewMutation.isPending}
                      loadingText="Submitting Review..."
                    >
                      {existingReview ? "Update Review" : "Submit Review"}
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
                <span className="text-slate-400">Student ID</span>
                <span className="font-semibold text-slate-800">{submission.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attempt Number</span>
                <span className="font-semibold">Attempt #{submission.attemptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <StatusBadge status={submission.status} />
              </div>
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
                  <span className="text-slate-400">Policy</span>
                  <span>{assignment.submissionPolicy}</span>
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
