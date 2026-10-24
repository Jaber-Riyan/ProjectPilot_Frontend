"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Layers,
  Edit3,
  Trash2,
  Video,
  FileText,
  ExternalLink,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/feedback/status-badge";
import { DetailLoadingSkeleton } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { useCourse, useDeleteCourse } from "@/features/courses/hooks/use-courses";
import { useModules } from "@/features/modules/hooks/use-modules";
import { useContentItems } from "@/features/content/hooks/use-content";
import type { ContentItem } from "@/types/domain";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;
  const router = useRouter();
  const { canAccessCourse } = usePermissions();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "mod-1": true,
    "mod-4": true,
    "mod-6": true,
  });

  const { data: course, isLoading, isError, error } = useCourse(courseId);
  const { data: modules = [] } = useModules(course?.id);
  const { data: allContent = [] } = useContentItems();
  const deleteMutation = useDeleteCourse();

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
        <ErrorState
          title="Unable to load course"
          message={error instanceof Error ? error.message : "Course not found or access denied."}
          onRetry={() => router.push("/courses")}
        />
      </DashboardShell>
    );
  }

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleDelete = () => {
    deleteMutation.mutate(course.id, {
      onSuccess: () => {
        router.push("/courses");
      },
    });
  };

  const getContentIcon = (type: ContentItem["type"]) => {
    switch (type) {
      case "VIDEO":
      case "YOUTUBE_VIDEO":
        return <Video size={15} className="text-blue-500" />;
      case "TEXT":
        return <FileText size={15} className="text-emerald-500" />;
      case "LINK":
        return <ExternalLink size={15} className="text-purple-500" />;
      case "ASSIGNMENT":
        return <GraduationCap size={15} className="text-amber-500" />;
      default:
        return <FileText size={15} className="text-slate-500" />;
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title={course.title}
        description={course.description}
        breadcrumbs={[
          { label: "Courses", href: "/courses" },
          { label: course.title },
        ]}
        badge={<StatusBadge status={course.status} />}
        actions={
          <div className="flex items-center gap-2">
            {canAccessCourse(course, "edit") && (
              <>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href={`/courses/${course.id}/modules`}>
                    <Layers size={15} /> Manage Modules
                  </Link>
                </Button>
                <Button asChild size="sm" className="gap-1.5">
                  <Link href={`/courses/${course.id}/edit`}>
                    <Edit3 size={15} /> Edit Course
                  </Link>
                </Button>
              </>
            )}
            {canAccessCourse(course, "delete") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={15} />
              </Button>
            )}
          </div>
        }
      />

      {/* Meta Specs */}
      <div className="flex flex-wrap items-center gap-4 py-3 px-5 mb-8 rounded-2xl border border-slate-200 bg-white shadow-card text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Clock size={15} className="text-slate-400" />
          <span>Estimated Hours: <strong>{course.estimatedHours} hrs</strong></span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <BookOpen size={15} className="text-slate-400" />
          <span>Difficulty: <strong>{course.level}</strong></span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Layers size={15} className="text-slate-400" />
          <span>Modules: <strong>{modules.length}</strong></span>
        </div>
      </div>

      {/* Course Syllabus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Course Syllabus & Curriculum</h2>
          {canAccessCourse(course, "edit") && (
            <Button asChild size="sm" variant="ghost" className="text-xs gap-1">
              <Link href={`/courses/${course.id}/modules`}>
                <Plus size={14} /> Add Module
              </Link>
            </Button>
          )}
        </div>

        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No modules have been created for this course yet.
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((mod, index) => {
              const isOpen = !!expandedModules[mod.id];
              const moduleItems = allContent.filter((c) => c.moduleId === mod.id);

              return (
                <div
                  key={mod.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card"
                >
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-7 place-items-center rounded-lg bg-blue-100 text-brand-700 text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{mod.title}</h3>
                        {mod.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {mod.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{moduleItems.length} lessons</span>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-slate-100 border-t border-slate-100 p-2 sm:p-4">
                      {moduleItems.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          No lessons added in this module.
                        </p>
                      ) : (
                        moduleItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-3 hover:bg-slate-50 rounded-xl transition gap-2"
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              <span className="grid size-7 place-items-center rounded-lg bg-slate-100 mt-0.5 sm:mt-0">
                                {getContentIcon(item.type)}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                  {item.type.replace("_", " ")}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pl-10 sm:pl-0">
                              {item.assignmentId && (
                                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                  <Link href={`/assignments/${item.assignmentId}`}>
                                    Open Assignment
                                  </Link>
                                </Button>
                              )}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                                >
                                  View Resource <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Course"
        description={`Are you sure you want to permanently delete "${course.title}"? All modules and associated lessons will be removed.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </DashboardShell>
  );
}
