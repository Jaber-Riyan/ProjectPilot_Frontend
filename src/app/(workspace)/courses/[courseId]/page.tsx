"use client";

import { use, useState, useMemo } from "react";
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
  Play,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/feedback/status-badge";
import { DetailLoadingSkeleton } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { useSession } from "@/hooks/use-session";
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
  const { user } = useSession();
  const { canAccessCourse } = usePermissions();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedContentItems, setExpandedContentItems] = useState<Record<string, boolean>>({});

  const toggleContentItem = (itemId: string) => {
    setExpandedContentItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getYouTubeEmbedUrl = (url?: string | null): string | null => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com")) {
        const v = parsed.searchParams.get("v");
        if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
        const pathParts = parsed.pathname.split("/").filter(Boolean);
        if (pathParts[0] === "embed" && pathParts[1]) {
          return `https://www.youtube-nocookie.com/embed/${pathParts[1]}`;
        }
      }
      if (parsed.hostname.includes("youtu.be")) {
        const id = parsed.pathname.slice(1);
        if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const { data: course, isLoading, isError, error } = useCourse(courseId);
  const { data: mockModules = [] } = useModules(course?.id);
  const { data: allContent = [] } = useContentItems();
  const deleteMutation = useDeleteCourse();

  // Combine real backend modules with mock modules fallback
  const displayModules = useMemo(() => {
    if (!course) return [];
    if (course.courseModules && course.courseModules.length > 0) {
      return course.courseModules
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((cm) => ({
          id: cm.module?.id || cm.moduleId || cm.id,
          title: cm.module?.title || `Module ${cm.order}`,
          description: cm.module?.description,
          order: cm.order,
          contentItems: (cm.module?.contentItems || []) as ContentItem[],
        }));
    }
    return mockModules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      contentItems: allContent.filter((c) => c.moduleId === m.id),
    }));
  }, [course, mockModules, allContent]);

  const isMentorOrAdmin = user?.role === "MENTOR" || user?.role === "ADMIN";
  const canEdit =
    isMentorOrAdmin &&
    (user?.role === "ADMIN" || Boolean(course && canAccessCourse(course, "edit")));

  const canDelete =
    isMentorOrAdmin &&
    (user?.role === "ADMIN" || Boolean(course && canAccessCourse(course, "delete")));

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
    setDeleteError(null);
    deleteMutation.mutate(course.id, {
      onSuccess: () => {
        router.push("/courses");
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to delete course";
        setDeleteError(msg);
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
        description={course.description || undefined}
        breadcrumbs={[
          { label: "Courses", href: "/courses" },
          { label: course.title },
        ]}
        badge={<StatusBadge status={course.status} />}
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
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
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                title="Delete course"
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
          <span>
            Estimated Hours: <strong>{course.estimatedHours ?? 10} hrs</strong>
          </span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <BookOpen size={15} className="text-slate-400" />
          <span>
            Difficulty: <strong>{course.level ?? "Standard"}</strong>
          </span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Layers size={15} className="text-slate-400" />
          <span>
            Modules: <strong>{displayModules.length}</strong>
          </span>
        </div>
      </div>

      {/* Course Syllabus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Course Syllabus & Curriculum</h2>
          {canEdit && (
            <Button asChild size="sm" variant="ghost" className="text-xs gap-1">
              <Link href={`/courses/${course.id}/modules`}>
                <Plus size={14} /> Add Module
              </Link>
            </Button>
          )}
        </div>

        {displayModules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No modules have been created for this course yet.
          </div>
        ) : (
          <div className="space-y-3">
            {displayModules.map((mod, index) => {
              const isOpen = expandedModules[mod.id] ?? index === 0;
              const moduleItems = mod.contentItems || [];

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
                        moduleItems.map((item) => {
                          const isContentOpen = expandedContentItems[item.id] ?? false;
                          const embedUrl = getYouTubeEmbedUrl(item.url);

                          return (
                            <div
                              key={item.id}
                              className="rounded-xl border border-transparent hover:border-slate-200/80 transition overflow-hidden"
                            >
                              <div
                                onClick={() => toggleContentItem(item.id)}
                                role="button"
                                tabIndex={0}
                                className="w-full flex items-center justify-between py-2.5 px-3 hover:bg-slate-50/80 rounded-xl transition cursor-pointer gap-2 text-left"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="grid size-7 place-items-center rounded-lg bg-slate-100 shrink-0">
                                    {getContentIcon(item.type)}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 truncate">
                                      {item.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                      <span className="uppercase font-bold tracking-wider">
                                        {item.type.replace("_", " ")}
                                      </span>
                                      {item.description && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate max-w-xs">{item.description}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline px-1"
                                    >
                                      Resource <ExternalLink size={12} />
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => toggleContentItem(item.id)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                    title={isContentOpen ? "Collapse Lesson Details" : "View Lesson Details"}
                                  >
                                    {isContentOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Content Drawer */}
                              {isContentOpen && (
                                <div className="mx-2 mb-3 mt-1 p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 animate-in fade-in-50 duration-150">
                                  {item.description && (
                                    <div className="text-xs text-slate-600 font-medium pb-2 border-b border-slate-200/60">
                                      <span className="text-slate-400 font-semibold mr-1.5 uppercase text-[10px] tracking-wider">
                                        Overview:
                                      </span>
                                      {item.description}
                                    </div>
                                  )}

                                  {/* TEXT Content Body */}
                                  {item.type === "TEXT" && (
                                    <div>
                                      {item.body ? (
                                        <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 leading-relaxed bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                          {item.body}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-400 italic">
                                          No reading body has been added for this text lesson yet.
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* VIDEO or YOUTUBE_VIDEO */}
                                  {(item.type === "VIDEO" || item.type === "YOUTUBE_VIDEO") && (
                                    <div className="space-y-2">
                                      {embedUrl ? (
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-black">
                                          <iframe
                                            src={embedUrl}
                                            title={item.title}
                                            className="absolute inset-0 w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        </div>
                                      ) : item.url ? (
                                        <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col gap-2">
                                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                                            <Play size={14} className="text-blue-500" />
                                            <span>Video Stream Resource</span>
                                          </div>
                                          <p className="text-xs text-slate-500 break-all">{item.url}</p>
                                          <div>
                                            <Button asChild size="sm" variant="default" className="text-xs gap-1.5 mt-1">
                                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                Watch Video in New Tab <ExternalLink size={12} />
                                              </a>
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-400 italic">No video URL linked yet.</p>
                                      )}
                                    </div>
                                  )}

                                  {/* LINK External Resource */}
                                  {item.type === "LINK" && (
                                    <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                          <ExternalLink size={13} className="text-purple-600" />
                                          <span>External Learning Resource</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono mt-1 break-all">
                                          {item.url || "No link provided"}
                                        </p>
                                      </div>
                                      {item.url && (
                                        <Button asChild size="sm" className="shrink-0 text-xs gap-1">
                                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                                            Open Resource <ExternalLink size={12} />
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                  )}

                                  {/* ASSIGNMENT Link Card */}
                                  {item.type === "ASSIGNMENT" && (
                                    <div className="p-4 rounded-xl bg-white border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                      <div>
                                        <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                                          <GraduationCap size={15} className="text-amber-600" />
                                          <span>Curriculum Assignment</span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">
                                          Assessment linked to module. Complete and submit your work for mentor evaluation.
                                        </p>
                                      </div>
                                      {item.assignmentId ? (
                                        <Button asChild size="sm" className="shrink-0 text-xs gap-1">
                                          <Link href={`/assignments/${item.assignmentId}`}>
                                            View Assignment Assessment <ChevronRight size={13} />
                                          </Link>
                                        </Button>
                                      ) : (
                                        <span className="text-xs text-slate-400">No assignment ID linked</span>
                                      )}
                                    </div>
                                  )}

                                  {/* Body text fallback if any other content type also has body */}
                                  {item.type !== "TEXT" && item.body && (
                                    <div className="whitespace-pre-wrap font-sans text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                                      {item.body}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
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
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
        title="Delete Course"
        description={
          deleteError
            ? `Deletion failed: ${deleteError}`
            : `Are you sure you want to permanently delete "${course.title}"? This action cannot be undone.`
        }
        confirmLabel={deleteError ? "Retry Delete" : "Delete"}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </DashboardShell>
  );
}
