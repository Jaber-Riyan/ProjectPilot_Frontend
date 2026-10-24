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
import { courseSchema, type CourseFormValues } from "@/features/courses/schemas/course.schema";
import { useCreateCourse } from "@/features/courses/hooks/use-courses";
import { useSession } from "@/hooks/use-session";

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useSession();
  const createMutation = useCreateCourse();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      imageUrl: "",
      status: "DRAFT",
      isPublished: false,
      level: "BEGINNER",
      estimatedHours: 20,
      mentorIds: user?.id ? [user.id] : [],
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titleVal = e.target.value;
    setValue("title", titleVal, { shouldValidate: true });
    // Suggest slug if slug is pristine
    const suggestedSlug = titleVal
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", suggestedSlug, { shouldValidate: true });
  };

  const onSubmit = (values: CourseFormValues) => {
    const isPublished = values.status === "PUBLISHED" || values.isPublished;
    createMutation.mutate(
      {
        ...values,
        isPublished,
        mentorIds: user?.id ? [user.id] : [],
      },
      {
        onSuccess: (newCourse) => {
          router.push(`/courses/${newCourse.id}`);
        },
      }
    );
  };

  return (
    <RequirePermission permission={PERMISSIONS.COURSE_CREATE}>
      <DashboardShell>
        <PageHeader
          title="Create New Course"
          description="Design a comprehensive learning pathway with modules, lessons, and assignments."
          breadcrumbs={[
            { label: "Courses", href: "/courses" },
            { label: "New Course" },
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
                  description="A concise, descriptive title for the course."
                >
                  <Input
                    {...register("title")}
                    onChange={handleTitleChange}
                    placeholder="e.g. Full-Stack TypeScript & Next.js Masterclass"
                  />
                </FormField>

                <FormField
                  label="URL Slug"
                  required
                  error={errors.slug?.message}
                  description="Unique lowercase alphanumeric URL identifier."
                >
                  <Input {...register("slug")} placeholder="fullstack-typescript-nextjs" />
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
                  description="Detailed overview of syllabus, prerequisites, and learning outcomes."
                >
                  <Textarea
                    {...register("description")}
                    rows={4}
                    placeholder="Provide a detailed description of what students will build and learn..."
                  />
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

                {createMutation.isError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                    {createMutation.error instanceof Error
                      ? createMutation.error.message
                      : "Failed to create course. Please review your input."}
                  </div>
                )}

                <FormActions
                  submitLabel="Create Course"
                  loadingLabel="Creating..."
                  isLoading={createMutation.isPending}
                  onCancel={() => router.push("/courses")}
                />
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </RequirePermission>
  );
}
