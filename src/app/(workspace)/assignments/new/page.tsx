"use client";

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
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { assignmentSchema, type AssignmentFormValues } from "@/features/assignments/schemas/assignment.schema";
import { useCreateAssignment } from "@/features/assignments/hooks/use-assignments";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useSession } from "@/hooks/use-session";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { user } = useSession();
  const { data: coursesData } = useCourses({ limit: 100 });
  const createMutation = useCreateAssignment();

  const courses = coursesData?.items ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      courseId: courses[0]?.id ?? "",
      description: "",
      instructions: "",
      status: "DRAFT",
      submissionPolicy: "RESUBMITTABLE",
      dueDate: "",
      maxScore: 100,
    },
  });

  const onSubmit = (values: AssignmentFormValues) => {
    createMutation.mutate(
      {
        ...values,
        createdById: user?.id ?? "unknown",
      },
      {
        onSuccess: (newAsg) => {
          router.push(`/assignments/${newAsg.id}`);
        },
      }
    );
  };

  return (
    <RequirePermission permission={PERMISSIONS.ASSIGNMENT_CREATE}>
      <DashboardShell>
        <PageHeader
          title="Create New Assignment"
          description="Define practical tasks, submission constraints, evaluation rubrics, and deadlines."
          breadcrumbs={[
            { label: "Assignments", href: "/assignments" },
            { label: "New Assignment" },
          ]}
        />

        <div className="max-w-3xl">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  label="Assignment Title"
                  required
                  error={errors.title?.message}
                >
                  <Input {...register("title")} placeholder="e.g. Build an RBAC Route Guard System" />
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
                  description="Brief overview visible on assignment cards and listings."
                >
                  <Textarea {...register("description")} rows={2} placeholder="Summary of the challenge..." />
                </FormField>

                <FormField
                  label="Detailed Instructions & Requirements"
                  required
                  error={errors.instructions?.message}
                  description="Step-by-step instructions, submission specifications, and grading criteria."
                >
                  <Textarea {...register("instructions")} rows={6} placeholder="1. Define the interfaces..." />
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

                  <FormField label="Maximum Points" error={errors.maxScore?.message}>
                    <Input type="number" min={1} max={1000} {...register("maxScore")} />
                  </FormField>
                </div>

                {createMutation.isError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                    {createMutation.error instanceof Error
                      ? createMutation.error.message
                      : "Failed to create assignment."}
                  </div>
                )}

                <FormActions
                  submitLabel="Create Assignment"
                  loadingLabel="Creating..."
                  isLoading={createMutation.isPending}
                  onCancel={() => router.push("/assignments")}
                />
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </RequirePermission>
  );
}
