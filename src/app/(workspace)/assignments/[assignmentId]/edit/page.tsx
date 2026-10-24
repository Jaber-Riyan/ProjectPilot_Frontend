"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/forms/form-field";
import { FormActions } from "@/components/forms/form-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DetailLoadingSkeleton } from "@/components/feedback/loading-state";
import { AccessDenied } from "@/components/access/access-denied";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useAssignment,
  useUpdateAssignment,
} from "@/features/assignments/hooks/use-assignments";
import { useCourses } from "@/features/courses/hooks/use-courses";
import {
  assignmentSchema,
  type AssignmentFormValues,
} from "@/features/assignments/schemas/assignment.schema";

export default function EditAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.assignmentId;
  const router = useRouter();
  const { canAccessAssignment } = usePermissions();
  const { data: assignment, isLoading, isError } = useAssignment(assignmentId);
  const { data: coursesData } = useCourses({ limit: 100 });
  const updateMutation = useUpdateAssignment();

  const courses = coursesData?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
  });

  useEffect(() => {
    if (assignment) {
      reset({
        title: assignment.title,
        courseId: assignment.courseId ?? "",
        description: assignment.description,
        instructions: assignment.instructions,
        status: assignment.status,
        submissionPolicy: assignment.submissionPolicy,
        dueDate: assignment.dueDate ? assignment.dueDate.split("T")[0] : "",
        maxScore: assignment.maxScore ?? 100,
      });
    }
  }, [assignment, reset]);

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
        <AccessDenied description="Assignment not found or not accessible." />
      </DashboardShell>
    );
  }

  if (!canAccessAssignment(assignment, undefined, "edit")) {
    return (
      <DashboardShell>
        <AccessDenied
          title="Edit Restricted"
          description="You do not have permission to modify this assignment."
        />
      </DashboardShell>
    );
  }

  const onSubmit = (values: AssignmentFormValues) => {
    updateMutation.mutate(
      {
        id: assignment.id,
        updates: values,
      },
      {
        onSuccess: () => {
          router.push(`/assignments/${assignment.id}`);
        },
      }
    );
  };

  return (
    <DashboardShell>
      <PageHeader
        title={`Edit Assignment: ${assignment.title}`}
        description="Update challenge guidelines, requirements, grading points, and deadlines."
        breadcrumbs={[
          { label: "Assignments", href: "/assignments" },
          { label: assignment.title, href: `/assignments/${assignment.id}` },
          { label: "Edit" },
        ]}
      />

      <div className="max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField label="Assignment Title" required error={errors.title?.message}>
                <Input {...register("title")} />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Associated Course" error={errors.courseId?.message}>
                  <Select {...register("courseId")}>
                    <option value="">No course (Independent)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Publication Status" error={errors.status?.message}>
                  <Select {...register("status")}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="CLOSED">Closed</option>
                  </Select>
                </FormField>
              </div>

              <FormField
                label="Short Description"
                required
                error={errors.description?.message}
              >
                <Textarea {...register("description")} rows={2} />
              </FormField>

              <FormField
                label="Instructions & Requirements"
                required
                error={errors.instructions?.message}
              >
                <Textarea {...register("instructions")} rows={6} />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Submission Policy" error={errors.submissionPolicy?.message}>
                  <Select {...register("submissionPolicy")}>
                    <option value="RESUBMITTABLE">Resubmissions Allowed</option>
                    <option value="ONE_TIME">Single Attempt Only</option>
                  </Select>
                </FormField>

                <FormField label="Due Date" error={errors.dueDate?.message}>
                  <Input type="date" {...register("dueDate")} />
                </FormField>

                <FormField label="Max Points" error={errors.maxScore?.message}>
                  <Input type="number" min={1} max={1000} {...register("maxScore")} />
                </FormField>
              </div>

              {updateMutation.isError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                  {updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : "Failed to update assignment."}
                </div>
              )}

              <FormActions
                submitLabel="Save Changes"
                loadingLabel="Saving..."
                isLoading={updateMutation.isPending}
                onCancel={() => router.push(`/assignments/${assignment.id}`)}
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
