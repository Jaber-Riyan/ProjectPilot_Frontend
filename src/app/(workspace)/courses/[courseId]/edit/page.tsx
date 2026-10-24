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
import { useSession } from "@/hooks/use-session";
import { useCourse, useUpdateCourse } from "@/features/courses/hooks/use-courses";
import { courseSchema, type CourseFormValues } from "@/features/courses/schemas/course.schema";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;
  const router = useRouter();
  const { user } = useSession();
  const { canAccessCourse } = usePermissions();
  const { data: course, isLoading, isError } = useCourse(courseId);
  const updateMutation = useUpdateCourse();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
  });

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        slug: course.slug,
        description: course.description ?? "",
        imageUrl: course.imageUrl ?? "",
        status: course.status,
        isPublished: course.isPublished ?? course.status === "PUBLISHED",
        level: course.level ?? "BEGINNER",
        estimatedHours: course.estimatedHours ?? 10,
        mentorIds: course.mentorIds,
      });
    }
  }, [course, reset]);

  if (isLoading) {
    return (
      <DashboardShell>
        <DetailLoadingSkeleton />
      </DashboardShell>
    );
  }

  if (isError || !course) {
    return (
      <DashboardShell>
        <AccessDenied description="Course not found or you do not have permission to modify it." />
      </DashboardShell>
    );
  }

  const canEdit =
    canAccessCourse(course, "edit") ||
    user?.role === "MENTOR" ||
    user?.role === "ADMIN";

  if (!canEdit) {
    return (
      <DashboardShell>
        <AccessDenied
          title="Course Edit Restricted"
          description="Only mentors or administrators can modify this course."
        />
      </DashboardShell>
    );
  }

  const onSubmit = (values: CourseFormValues) => {
    const isPublished = values.status === "PUBLISHED" || values.isPublished;
    updateMutation.mutate(
      {
        id: course.id,
        updates: {
          ...values,
          isPublished,
        },
      },
      {
        onSuccess: () => {
          router.push(`/courses/${course.id}`);
        },
      }
    );
  };

  return (
    <DashboardShell>
      <PageHeader
        title={`Edit Course: ${course.title}`}
        description="Update course metadata, syllabus description, difficulty level, and publication status."
        breadcrumbs={[
          { label: "Courses", href: "/courses" },
          { label: course.title, href: `/courses/${course.id}` },
          { label: "Edit" },
        ]}
      />

      <div className="max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                label="Course Title"
                required
                error={errors.title?.message}
                description="A concise title describing the course curriculum."
              >
                <Input {...register("title")} />
              </FormField>

              <FormField
                label="URL Slug"
                required
                error={errors.slug?.message}
                description="URL identifier for this course."
              >
                <Input {...register("slug")} />
              </FormField>

              <FormField
                label="Banner Image URL (Optional)"
                error={errors.imageUrl?.message}
                description="Public image URL for course card and cover display."
              >
                <Input
                  type="url"
                  {...register("imageUrl")}
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </FormField>

              <FormField
                label="Course Description"
                error={errors.description?.message}
              >
                <Textarea {...register("description")} rows={4} />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Publication Status" error={errors.status?.message}>
                  <Select {...register("status")}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </Select>
                </FormField>

                <FormField label="Target Skill Level" error={errors.level?.message}>
                  <Select {...register("level")}>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </Select>
                </FormField>

                <FormField
                  label="Estimated Hours"
                  error={errors.estimatedHours?.message}
                >
                  <Input type="number" min={1} max={500} {...register("estimatedHours")} />
                </FormField>
              </div>

              {updateMutation.isError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                  {updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : "Failed to update course."}
                </div>
              )}

              <FormActions
                submitLabel="Save Changes"
                loadingLabel="Saving..."
                isLoading={updateMutation.isPending}
                onCancel={() => router.push(`/courses/${course.id}`)}
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
