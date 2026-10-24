"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  Layers,
  Video,
  FileText,
  ExternalLink,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { AccessDenied } from "@/components/access/access-denied";
import { DetailLoadingSkeleton } from "@/components/feedback/loading-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { useCourse } from "@/features/courses/hooks/use-courses";
import {
  useModules,
  useCreateModule,
  useDeleteModule,
} from "@/features/modules/hooks/use-modules";
import {
  useContentItems,
  useCreateContentItem,
  useDeleteContentItem,
} from "@/features/content/hooks/use-content";
import { moduleSchema, type ModuleFormValues } from "@/features/modules/schemas/module.schema";
import { contentSchema, type ContentFormValues } from "@/features/content/schemas/content.schema";

export default function CourseModulesManagementPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;
  const { canAccessCourse } = usePermissions();

  const { data: course, isLoading: isCourseLoading } = useCourse(courseId);
  const { data: modules = [], isLoading: isModulesLoading } = useModules(course?.id);
  const { data: content = [] } = useContentItems();

  const createModuleMutation = useCreateModule();
  const deleteModuleMutation = useDeleteModule();
  const createContentMutation = useCreateContentItem();
  const deleteContentMutation = useDeleteContentItem();

  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [addContentModuleId, setAddContentModuleId] = useState<string | null>(null);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null);

  // Module form
  const {
    register: regMod,
    handleSubmit: handleModSubmit,
    reset: resetMod,
    formState: { errors: modErrors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      courseId,
      title: "",
      description: "",
      order: (modules.length ?? 0) + 1,
    },
  });

  // Content form
  const {
    register: regCnt,
    handleSubmit: handleCntSubmit,
    reset: resetCnt,
    watch: watchCnt,
    formState: { errors: cntErrors },
  } = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      moduleId: "",
      title: "",
      type: "TEXT",
      order: 1,
      body: "",
      url: "",
    },
  });

  const selectedContentType = watchCnt("type");

  if (isCourseLoading || isModulesLoading) {
    return (
      <DashboardShell>
        <DetailLoadingSkeleton />
      </DashboardShell>
    );
  }

  if (!course || !canAccessCourse(course, "edit")) {
    return (
      <DashboardShell>
        <AccessDenied
          title="Module Management Restricted"
          description="Only assigned mentors or administrators can add or remove modules from this course."
        />
      </DashboardShell>
    );
  }

  const onAddModule = (values: ModuleFormValues) => {
    createModuleMutation.mutate(
      {
        ...values,
        courseId: course.id,
        contentIds: [],
      },
      {
        onSuccess: () => {
          resetMod();
          setAddModuleOpen(false);
        },
      }
    );
  };

  const onAddContent = (values: ContentFormValues) => {
    if (!addContentModuleId) return;
    createContentMutation.mutate(
      {
        ...values,
        moduleId: addContentModuleId,
      },
      {
        onSuccess: () => {
          resetCnt();
          setAddContentModuleId(null);
        },
      }
    );
  };

  return (
    <DashboardShell>
      <PageHeader
        title={`Curriculum Editor — ${course.title}`}
        description="Organize modules, arrange syllabus sequence, and attach lessons, videos, and coursework assignments."
        breadcrumbs={[
          { label: "Courses", href: "/courses" },
          { label: course.title, href: `/courses/${course.id}` },
          { label: "Curriculum Editor" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/courses/${course.id}`}>
                <ArrowLeft size={15} /> Back to Course
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetMod({
                  courseId: course.id,
                  title: "",
                  description: "",
                  order: modules.length + 1,
                });
                setAddModuleOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus size={15} /> Add Module
            </Button>
          </div>
        }
      />

      {/* Modules List */}
      <div className="space-y-6">
        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400 mx-auto">
              <Layers size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No Modules Added Yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Add Module&quot; above to create the first syllabus unit for this course.
            </p>
          </div>
        ) : (
          modules.map((mod, idx) => {
            const moduleContent = content.filter((c) => c.moduleId === mod.id);

            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card space-y-4"
              >
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-brand-700 text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{mod.title}</h3>
                      {mod.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        resetCnt({
                          moduleId: mod.id,
                          title: "",
                          type: "TEXT",
                          order: moduleContent.length + 1,
                          body: "",
                          url: "",
                        });
                        setAddContentModuleId(mod.id);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <Plus size={13} /> Add Lesson
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteModuleId(mod.id)}
                      className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Lessons in this module */}
                <div className="space-y-2 pl-4">
                  {moduleContent.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No lessons added to this module yet.
                    </p>
                  ) : (
                    moduleContent.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 px-3 rounded-xl border border-slate-100 bg-slate-50/50"
                      >
                        <div className="flex items-center gap-2.5">
                          {item.type === "VIDEO" || item.type === "YOUTUBE_VIDEO" ? (
                            <Video size={14} className="text-blue-500" />
                          ) : item.type === "ASSIGNMENT" ? (
                            <GraduationCap size={14} className="text-amber-500" />
                          ) : item.type === "LINK" ? (
                            <ExternalLink size={14} className="text-purple-500" />
                          ) : (
                            <FileText size={14} className="text-emerald-500" />
                          )}
                          <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            {item.type}
                          </span>
                        </div>

                        <button
                          onClick={() => setDeleteContentId(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove lesson"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Module Modal */}
      <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
        <DialogCloseButton onClose={() => setAddModuleOpen(false)} />
        <form onSubmit={handleModSubmit(onAddModule)}>
          <DialogHeader>
            <DialogTitle>Add Course Module</DialogTitle>
            <DialogDescription>Create a new syllabus unit for this course.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Module Title" required error={modErrors.title?.message}>
              <Input {...regMod("title")} placeholder="e.g. Authentication & Authorization" />
            </FormField>

            <FormField label="Module Description" error={modErrors.description?.message}>
              <Textarea {...regMod("description")} rows={3} placeholder="Brief summary of lessons in this module..." />
            </FormField>

            <FormField label="Sequence Order" required error={modErrors.order?.message}>
              <Input type="number" min={1} {...regMod("order")} />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddModuleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createModuleMutation.isPending}>
              {createModuleMutation.isPending ? "Adding..." : "Add Module"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Add Content Item Modal */}
      <Dialog open={Boolean(addContentModuleId)} onOpenChange={(open) => !open && setAddContentModuleId(null)}>
        <DialogCloseButton onClose={() => setAddContentModuleId(null)} />
        <form onSubmit={handleCntSubmit(onAddContent)}>
          <DialogHeader>
            <DialogTitle>Add Lesson Content</DialogTitle>
            <DialogDescription>Attach learning materials, video recordings, or assignments to this module.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Lesson Title" required error={cntErrors.title?.message}>
              <Input {...regCnt("title")} placeholder="e.g. Understanding Access Tokens" />
            </FormField>

            <FormField label="Content Type" error={cntErrors.type?.message}>
              <Select {...regCnt("type")}>
                <option value="TEXT">Text Reading</option>
                <option value="VIDEO">Video</option>
                <option value="YOUTUBE_VIDEO">YouTube Embed</option>
                <option value="LINK">External Link</option>
                <option value="ASSIGNMENT">Assignment Association</option>
              </Select>
            </FormField>

            {selectedContentType === "TEXT" && (
              <FormField label="Lesson Body (Markdown supported)" required error={cntErrors.body?.message}>
                <Textarea {...regCnt("body")} rows={5} placeholder="Write lesson content here..." />
              </FormField>
            )}

            {(selectedContentType === "VIDEO" || selectedContentType === "YOUTUBE_VIDEO" || selectedContentType === "LINK") && (
              <FormField label="Resource URL" required error={cntErrors.url?.message}>
                <Input {...regCnt("url")} placeholder="https://example.com/video" />
              </FormField>
            )}

            {selectedContentType === "ASSIGNMENT" && (
              <FormField label="Associated Assignment ID" required error={cntErrors.assignmentId?.message}>
                <Input {...regCnt("assignmentId")} placeholder="e.g. asg-1" />
              </FormField>
            )}

            <FormField label="Order in Module" required error={cntErrors.order?.message}>
              <Input type="number" min={1} {...regCnt("order")} />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddContentModuleId(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createContentMutation.isPending}>
              {createContentMutation.isPending ? "Adding..." : "Add Lesson"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Module Dialog */}
      <ConfirmDialog
        open={Boolean(deleteModuleId)}
        onOpenChange={(open) => !open && setDeleteModuleId(null)}
        title="Delete Module"
        description="Are you sure you want to delete this module and all its lessons? This cannot be undone."
        confirmLabel="Delete Module"
        isLoading={deleteModuleMutation.isPending}
        onConfirm={() => {
          if (deleteModuleId) {
            deleteModuleMutation.mutate(deleteModuleId, {
              onSuccess: () => setDeleteModuleId(null),
            });
          }
        }}
      />

      {/* Delete Content Dialog */}
      <ConfirmDialog
        open={Boolean(deleteContentId)}
        onOpenChange={(open) => !open && setDeleteContentId(null)}
        title="Delete Lesson"
        description="Are you sure you want to remove this lesson from the module?"
        confirmLabel="Remove"
        isLoading={deleteContentMutation.isPending}
        onConfirm={() => {
          if (deleteContentId) {
            deleteContentMutation.mutate(deleteContentId, {
              onSuccess: () => setDeleteContentId(null),
            });
          }
        }}
      />
    </DashboardShell>
  );
}
