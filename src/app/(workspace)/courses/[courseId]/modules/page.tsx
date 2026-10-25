"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
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
  ChevronUp,
  ChevronDown,
  Edit,
  Unlink,
  AlertCircle,
  Search,
  Check,
  X,
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
import { useSession } from "@/hooks/use-session";
import { useCourse } from "@/features/courses/hooks/use-courses";
import { useAssignments } from "@/features/assignments/hooks/use-assignments";
import {
  useCourseModules,
  useAttachOrAddModule,
  useDetachModule,
  useReorderCourseModules,
  useModulesLibrary,
  useUpdateModule,
} from "@/features/modules/hooks/use-modules";
import {
  useCreateContentItem,
  useUpdateContentItem,
  useDeleteContentItem,
} from "@/features/content/hooks/use-content";
import { contentService } from "@/lib/services/content.service";
import { queryKeys } from "@/lib/api/query-keys";
import {
  attachOrAddModuleSchema,
  updateModuleSchema,
  type AttachOrAddModuleFormValues,
  type UpdateModuleFormValues,
} from "@/features/modules/schemas/module.schema";
import {
  contentSchema,
  updateContentItemSchema,
  type ContentFormValues,
  type UpdateContentFormValues,
} from "@/features/content/schemas/content.schema";
import type { ContentItem, ModuleDetailWithContent } from "@/types/domain";

export default function CourseModulesManagementPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { canAccessCourse } = usePermissions();

  const { data: course, isLoading: isCourseLoading } = useCourse(courseId);
  const {
    data: modules = [],
    isLoading: isModulesLoading,
  } = useCourseModules(course?.id);
  const { data: libraryData } = useModulesLibrary({ limit: 200 });
  const { data: assignmentsData } = useAssignments({ limit: 100 });
  const assignmentsList = useMemo(() => assignmentsData?.items ?? [], [assignmentsData]);

  const attachOrAddMutation = useAttachOrAddModule(course?.id || "");
  const detachMutation = useDetachModule(course?.id || "");
  const reorderModulesMutation = useReorderCourseModules(course?.id || "");
  const updateModuleMutation = useUpdateModule();

  const createContentMutation = useCreateContentItem();
  const updateContentMutation = useUpdateContentItem();
  const deleteContentMutation = useDeleteContentItem();

  // State management
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [moduleMode, setModuleMode] = useState<"NEW" | "EXISTING">("NEW");
  const [librarySearch, setLibrarySearch] = useState("");
  const [editModuleItem, setEditModuleItem] = useState<ModuleDetailWithContent | null>(null);
  const [detachModuleTarget, setDetachModuleTarget] = useState<ModuleDetailWithContent | null>(null);

  const [addContentModuleId, setAddContentModuleId] = useState<string | null>(null);
  const [addAssignmentSearch, setAddAssignmentSearch] = useState("");
  const [editContentItem, setEditContentItem] = useState<ContentItem | null>(null);
  const [editAssignmentSearch, setEditAssignmentSearch] = useState("");
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  // Available library modules not yet attached to this course
  const availableLibraryModules = useMemo(() => {
    if (!libraryData?.items) return [];
    const attachedIds = new Set(modules.map((m) => m.id));
    return libraryData.items.filter((libMod) => !attachedIds.has(libMod.id));
  }, [libraryData, modules]);

  // Filtered library modules based on search
  const filteredLibraryModules = useMemo(() => {
    if (!librarySearch.trim()) return availableLibraryModules;
    const q = librarySearch.toLowerCase().trim();
    return availableLibraryModules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [availableLibraryModules, librarySearch]);

  // Add / Attach Module Form
  const {
    register: regAttach,
    handleSubmit: handleAttachSubmit,
    reset: resetAttach,
    setValue: setAttachValue,
    watch: watchAttach,
    formState: { errors: attachErrors },
  } = useForm<AttachOrAddModuleFormValues>({
    resolver: zodResolver(attachOrAddModuleSchema),
    defaultValues: {
      mode: "NEW",
      moduleId: "",
      title: "",
      description: "",
      isPublished: true,
      order: (modules.length ?? 0) + 1,
    },
  });

  // Edit Module Form
  const {
    register: regEditMod,
    handleSubmit: handleEditModSubmit,
    reset: resetEditMod,
    formState: { errors: editModErrors },
  } = useForm<UpdateModuleFormValues>({
    resolver: zodResolver(updateModuleSchema),
  });

  // Add Content Form
  const {
    register: regCnt,
    handleSubmit: handleCntSubmit,
    reset: resetCnt,
    watch: watchCnt,
    setValue: setCntValue,
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
      assignmentId: "",
      description: "",
    },
  });

  // Edit Content Form
  const {
    register: regEditCnt,
    handleSubmit: handleEditCntSubmit,
    reset: resetEditCnt,
    watch: watchEditCnt,
    setValue: setEditCntValue,
    formState: { errors: editCntErrors },
  } = useForm<UpdateContentFormValues>({
    resolver: zodResolver(updateContentItemSchema),
  });

  const selectedContentType = watchCnt("type");
  const selectedAssignmentId = watchCnt("assignmentId");
  const selectedEditContentType = watchEditCnt("type");
  const selectedEditAssignmentId = watchEditCnt("assignmentId");
  const selectedModuleId = watchAttach("moduleId");

  // Filtered assignments for Add Content
  const filteredAssignments = useMemo(() => {
    if (!addAssignmentSearch.trim()) return assignmentsList;
    const q = addAssignmentSearch.toLowerCase().trim();
    return assignmentsList.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.submissionPolicy.toLowerCase().includes(q) ||
        (a.instructions && a.instructions.toLowerCase().includes(q))
    );
  }, [assignmentsList, addAssignmentSearch]);

  // Filtered assignments for Edit Content
  const filteredEditAssignments = useMemo(() => {
    if (!editAssignmentSearch.trim()) return assignmentsList;
    const q = editAssignmentSearch.toLowerCase().trim();
    return assignmentsList.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.submissionPolicy.toLowerCase().includes(q) ||
        (a.instructions && a.instructions.toLowerCase().includes(q))
    );
  }, [assignmentsList, editAssignmentSearch]);

  if (isCourseLoading || isModulesLoading) {
    return (
      <DashboardShell>
        <DetailLoadingSkeleton />
      </DashboardShell>
    );
  }

  const isMentorOrAdmin = user?.role === "MENTOR" || user?.role === "ADMIN";
  const canManage =
    isMentorOrAdmin &&
    (user?.role === "ADMIN" || Boolean(course && canAccessCourse(course, "edit")));

  if (!course || !canManage) {
    return (
      <DashboardShell>
        <AccessDenied
          title="Curriculum Management Restricted"
          description="Only mentors or administrators can organize and manage the syllabus for this course."
        />
      </DashboardShell>
    );
  }

  // Handle Attach/Add Module Submission
  const onAttachOrAddModule = (values: AttachOrAddModuleFormValues) => {
    setActionError(null);
    const payload =
      values.mode === "EXISTING"
        ? { moduleId: values.moduleId, order: values.order }
        : {
            title: values.title,
            description: values.description || null,
            isPublished: values.isPublished ?? true,
            order: values.order,
          };

    attachOrAddMutation.mutate(payload, {
      onSuccess: () => {
        resetAttach();
        setAddModuleOpen(false);
      },
      onError: (err: unknown) => {
        setActionError(err instanceof Error ? err.message : "Failed to add module to course");
      },
    });
  };

  // Handle Edit Module Submission
  const onEditModule = (values: UpdateModuleFormValues) => {
    if (!editModuleItem) return;
    setActionError(null);
    updateModuleMutation.mutate(
      {
        id: editModuleItem.id,
        updates: values,
      },
      {
        onSuccess: () => {
          setEditModuleItem(null);
        },
        onError: (err: unknown) => {
          setActionError(err instanceof Error ? err.message : "Failed to update module");
        },
      }
    );
  };

  // Handle Detach Module
  const onConfirmDetach = () => {
    if (!detachModuleTarget) return;
    setActionError(null);
    detachMutation.mutate(detachModuleTarget.id, {
      onSuccess: () => setDetachModuleTarget(null),
      onError: (err: unknown) => {
        setActionError(err instanceof Error ? err.message : "Failed to detach module");
      },
    });
  };

  // Handle Reorder Module (Up or Down)
  const handleReorderModule = (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const reordered = [...modules];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const moduleIds = reordered.map((m) => m.id);
    setActionError(null);
    reorderModulesMutation.mutate(moduleIds, {
      onError: (err: unknown) => {
        setActionError(err instanceof Error ? err.message : "Failed to reorder modules");
      },
    });
  };

  // Handle Add Content
  const onAddContent = (values: ContentFormValues) => {
    if (!addContentModuleId) return;
    setActionError(null);
    createContentMutation.mutate(
      {
        moduleId: addContentModuleId,
        data: {
          title: values.title,
          type: values.type,
          description: values.description || null,
          body: values.body || null,
          url: values.url || null,
          assignmentId: values.assignmentId || null,
          order: values.order,
        },
      },
      {
        onSuccess: () => {
          resetCnt();
          setAddContentModuleId(null);
        },
        onError: (err: unknown) => {
          setActionError(err instanceof Error ? err.message : "Failed to create lesson");
        },
      }
    );
  };

  // Handle Edit Content
  const onEditContent = (values: UpdateContentFormValues) => {
    if (!editContentItem) return;
    setActionError(null);
    updateContentMutation.mutate(
      {
        id: editContentItem.id,
        updates: values,
      },
      {
        onSuccess: () => {
          setEditContentItem(null);
        },
        onError: (err: unknown) => {
          setActionError(err instanceof Error ? err.message : "Failed to update lesson");
        },
      }
    );
  };

  // Handle Reorder Content
  const handleReorderContent = async (
    moduleId: string,
    contentList: ContentItem[],
    currentIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= contentList.length) return;

    const reordered = [...contentList];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const contentItemIds = reordered.map((c) => c.id);
    setActionError(null);
    try {
      await contentService.reorder(moduleId, contentItemIds, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.byCourse(course.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(course.id) });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to reorder lessons");
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
      case "YOUTUBE_VIDEO":
        return <Video size={14} className="text-blue-500" />;
      case "ASSIGNMENT":
        return <GraduationCap size={14} className="text-amber-500" />;
      case "LINK":
        return <ExternalLink size={14} className="text-purple-500" />;
      default:
        return <FileText size={14} className="text-emerald-500" />;
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title={`Curriculum Editor — ${course.title}`}
        description="Organize syllabus units, sequence independent learning modules, and manage attached video lectures and coursework lessons."
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
                setActionError(null);
                setModuleMode("NEW");
                setLibrarySearch("");
                resetAttach({
                  mode: "NEW",
                  moduleId: "",
                  title: "",
                  description: "",
                  isPublished: true,
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

      {/* Global Action Error Alert */}
      {actionError && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <div className="flex-1">
            <strong>Error:</strong> {actionError}
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-6">
        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400 mx-auto">
              <Layers size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No Modules Added Yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Attach an existing module from your module library or create a new syllabus unit for this course.
            </p>
            <Button
              size="sm"
              className="mt-5 gap-1.5"
              onClick={() => {
                setActionError(null);
                setModuleMode("NEW");
                setLibrarySearch("");
                resetAttach({
                  mode: "NEW",
                  moduleId: "",
                  title: "",
                  description: "",
                  isPublished: true,
                  order: 1,
                });
                setAddModuleOpen(true);
              }}
            >
              <Plus size={15} /> Add First Module
            </Button>
          </div>
        ) : (
          modules.map((mod, idx) => {
            const moduleContent = mod.contentItems || [];

            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card space-y-4"
              >
                {/* Module Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-brand-700 text-sm font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{mod.title}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            mod.isPublished
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {mod.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                      {mod.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Module Action Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Reorder Module Buttons */}
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 mr-1">
                      <button
                        type="button"
                        onClick={() => handleReorderModule(idx, "up")}
                        disabled={idx === 0 || reorderModulesMutation.isPending}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Move Module Up"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderModule(idx, "down")}
                        disabled={idx === modules.length - 1 || reorderModulesMutation.isPending}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Move Module Down"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>

                    {/* Add Lesson */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActionError(null);
                        setAddAssignmentSearch("");
                        resetCnt({
                          moduleId: mod.id,
                          title: "",
                          type: "TEXT",
                          order: moduleContent.length + 1,
                          body: "",
                          url: "",
                          assignmentId: "",
                          description: "",
                        });
                        setAddContentModuleId(mod.id);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <Plus size={13} /> Add Lesson
                    </Button>

                    {/* Edit Module */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setActionError(null);
                        setEditModuleItem(mod);
                        resetEditMod({
                          title: mod.title,
                          description: mod.description || "",
                          isPublished: mod.isPublished,
                        });
                      }}
                      className="h-8 text-xs text-slate-600 hover:text-slate-900"
                      title="Edit Module Details"
                    >
                      <Edit size={14} />
                    </Button>

                    {/* Detach Module from Course */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setActionError(null);
                        setDetachModuleTarget(mod);
                      }}
                      className="h-8 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      title="Detach Module from Course"
                    >
                      <Unlink size={14} />
                    </Button>
                  </div>
                </div>

                {/* Lessons in this module */}
                <div className="space-y-2 pl-4">
                  {moduleContent.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No lessons added to this module yet. Click &quot;Add Lesson&quot; to attach content.
                    </p>
                  ) : (
                    moduleContent.map((item, itemIdx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 px-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getContentIcon(item.type)}
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider shrink-0">
                            {item.type}
                          </span>
                          {item.url && (
                            <span className="text-[11px] text-blue-500 hover:underline truncate max-w-xs">
                              {item.url}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Reorder Lesson Buttons */}
                          <div className="flex items-center rounded border border-slate-200 bg-slate-50 p-0.5 mr-1">
                            <button
                              type="button"
                              onClick={() => handleReorderContent(mod.id, moduleContent, itemIdx, "up")}
                              disabled={itemIdx === 0}
                              className="p-0.5 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition"
                              title="Move Lesson Up"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorderContent(mod.id, moduleContent, itemIdx, "down")}
                              disabled={itemIdx === moduleContent.length - 1}
                              className="p-0.5 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition"
                              title="Move Lesson Down"
                            >
                              <ChevronDown size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setActionError(null);
                              setEditAssignmentSearch("");
                              setEditContentItem(item);
                              resetEditCnt({
                                title: item.title,
                                type: item.type,
                                description: item.description || "",
                                body: item.body || "",
                                url: item.url || "",
                                assignmentId: item.assignmentId || "",
                              });
                            }}
                            className="text-slate-400 hover:text-slate-700 p-1"
                            title="Edit Lesson"
                          >
                            <Edit size={13} />
                          </button>

                          <button
                            onClick={() => {
                              setActionError(null);
                              setDeleteContentId(item.id);
                            }}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Remove Lesson"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Attach Module Modal */}
      <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
        <DialogCloseButton onClose={() => setAddModuleOpen(false)} />
        <form onSubmit={handleAttachSubmit(onAttachOrAddModule)}>
          <DialogHeader>
            <DialogTitle>Add Course Module</DialogTitle>
            <DialogDescription>
              Create a new syllabus module or attach an existing module from your library.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 my-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setModuleMode("NEW");
                setAttachValue("mode", "NEW");
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                moduleMode === "NEW"
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Create New Module
            </button>
            <button
              type="button"
              onClick={() => {
                setModuleMode("EXISTING");
                setAttachValue("mode", "EXISTING");
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                moduleMode === "EXISTING"
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Attach from Library ({availableLibraryModules.length})
            </button>
          </div>

          <div className="space-y-4 py-2">
            {moduleMode === "EXISTING" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Select Library Module <span className="text-red-500">*</span>
                  </label>
                  {selectedModuleId && (
                    <span className="text-[11px] font-normal text-emerald-600 font-mono truncate max-w-[200px]">
                      Selected: {availableLibraryModules.find((m) => m.id === selectedModuleId)?.title || selectedModuleId.slice(0, 8)}
                    </span>
                  )}
                </div>

                <input type="hidden" {...regAttach("moduleId")} />

                {availableLibraryModules.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    No unattached library modules available. Switch to &quot;Create New Module&quot; to author a new syllabus unit.
                  </p>
                ) : (
                  <>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        placeholder="Search modules by title or description..."
                        className="pl-8 text-xs h-9"
                      />
                      {librarySearch && (
                        <button
                          type="button"
                          onClick={() => setLibrarySearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                      {filteredLibraryModules.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No library modules matching &quot;{librarySearch}&quot;.
                        </p>
                      ) : (
                        filteredLibraryModules.map((libMod) => {
                          const isSelected = selectedModuleId === libMod.id;
                          return (
                            <div
                              key={libMod.id}
                              onClick={() => setAttachValue("moduleId", libMod.id, { shouldValidate: true })}
                              role="button"
                              tabIndex={0}
                              className={`flex items-start justify-between p-2.5 rounded-lg border text-left cursor-pointer transition ${
                                isSelected
                                  ? "border-brand-500 bg-blue-50/70 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <Layers size={14} className={isSelected ? "text-brand-600" : "text-slate-400"} />
                                  <span className={`text-xs font-semibold truncate ${isSelected ? "text-brand-900" : "text-slate-800"}`}>
                                    {libMod.title}
                                  </span>
                                </div>
                                {libMod.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                    {libMod.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                  <span>{libMod._count?.contentItems ?? 0} lessons</span>
                                  <span>•</span>
                                  <span>{libMod.isPublished ? "Published" : "Draft"}</span>
                                </div>
                              </div>

                              {isSelected && (
                                <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-white shrink-0 mt-0.5">
                                  <Check size={11} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}

                {attachErrors.moduleId?.message && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {attachErrors.moduleId.message}
                  </p>
                )}
              </div>
            ) : (
              <>
                <FormField label="Module Title" required error={attachErrors.title?.message}>
                  <Input
                    {...regAttach("title")}
                    placeholder="e.g. Authentication & Token Management"
                  />
                </FormField>

                <FormField label="Description" error={attachErrors.description?.message}>
                  <Textarea
                    {...regAttach("description")}
                    rows={3}
                    placeholder="Brief syllabus summary for this module..."
                  />
                </FormField>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="attachIsPublished"
                    {...regAttach("isPublished")}
                    className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="attachIsPublished" className="text-xs font-medium text-slate-700">
                    Publish immediately (visible to students in this course)
                  </label>
                </div>
              </>
            )}

            <FormField label="Sequence Order" error={attachErrors.order?.message}>
              <Input type="number" min={1} {...regAttach("order")} />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddModuleOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                attachOrAddMutation.isPending ||
                (moduleMode === "EXISTING" && availableLibraryModules.length === 0)
              }
            >
              {attachOrAddMutation.isPending
                ? "Attaching..."
                : moduleMode === "EXISTING"
                ? "Attach to Course"
                : "Create & Attach"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Module Modal */}
      <Dialog open={Boolean(editModuleItem)} onOpenChange={(open) => !open && setEditModuleItem(null)}>
        <DialogCloseButton onClose={() => setEditModuleItem(null)} />
        <form onSubmit={handleEditModSubmit(onEditModule)}>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>Update title, syllabus description, and publication status.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Module Title" required error={editModErrors.title?.message}>
              <Input {...regEditMod("title")} placeholder="Module title" />
            </FormField>

            <FormField label="Description" error={editModErrors.description?.message}>
              <Textarea {...regEditMod("description")} rows={3} placeholder="Module description..." />
            </FormField>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editIsPublished"
                {...regEditMod("isPublished")}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="editIsPublished" className="text-xs font-medium text-slate-700">
                Published (visible to enrolled students)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditModuleItem(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateModuleMutation.isPending}>
              {updateModuleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Detach Module Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(detachModuleTarget)}
        onOpenChange={(open) => !open && setDetachModuleTarget(null)}
        title="Detach Module from Course"
        description={`Are you sure you want to detach "${detachModuleTarget?.title}" from this course? The module and its lessons will remain safe in the library.`}
        confirmLabel="Detach from Course"
        isLoading={detachMutation.isPending}
        onConfirm={onConfirmDetach}
      />

      {/* Add Content Item Modal */}
      <Dialog
        open={Boolean(addContentModuleId)}
        onOpenChange={(open) => !open && setAddContentModuleId(null)}
      >
        <DialogCloseButton onClose={() => setAddContentModuleId(null)} />
        <form onSubmit={handleCntSubmit(onAddContent)}>
          <DialogHeader>
            <DialogTitle>Add Lesson Content</DialogTitle>
            <DialogDescription>
              Attach reading material, video lectures, external resources, or coursework assignments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Lesson Title" required error={cntErrors.title?.message}>
              <Input {...regCnt("title")} placeholder="e.g. Understanding Access Tokens" />
            </FormField>

            <FormField label="Content Type" error={cntErrors.type?.message}>
              <Select {...regCnt("type")}>
                <option value="TEXT">Text Reading (Markdown)</option>
                <option value="VIDEO">Direct Video URL</option>
                <option value="YOUTUBE_VIDEO">YouTube Embed</option>
                <option value="LINK">External Link</option>
                <option value="ASSIGNMENT">Assignment Association</option>
              </Select>
            </FormField>

            <FormField label="Brief Overview (optional)" error={cntErrors.description?.message}>
              <Input {...regCnt("description")} placeholder="Short summary of this lesson..." />
            </FormField>

            {selectedContentType === "TEXT" && (
              <FormField
                label="Lesson Body (Markdown supported)"
                required
                error={cntErrors.body?.message}
              >
                <Textarea
                  {...regCnt("body")}
                  rows={5}
                  placeholder="# Lesson Overview&#10;&#10;Explain the concepts here in Markdown..."
                />
              </FormField>
            )}

            {(selectedContentType === "VIDEO" ||
              selectedContentType === "YOUTUBE_VIDEO" ||
              selectedContentType === "LINK") && (
              <FormField
                label="Resource URL"
                required
                error={cntErrors.url?.message}
              >
                <Input {...regCnt("url")} placeholder="https://www.youtube.com/watch?v=..." />
              </FormField>
            )}

            {selectedContentType === "ASSIGNMENT" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Associated Assignment <span className="text-red-500">*</span>
                  </label>
                  {selectedAssignmentId && (
                    <span className="text-[11px] font-normal text-emerald-600 font-mono truncate max-w-[200px]">
                      Selected: {assignmentsList.find((a) => a.id === selectedAssignmentId)?.title || selectedAssignmentId.slice(0, 8)}
                    </span>
                  )}
                </div>

                <input type="hidden" {...regCnt("assignmentId")} />

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={addAssignmentSearch}
                    onChange={(e) => setAddAssignmentSearch(e.target.value)}
                    placeholder="Search assignment by title or policy..."
                    className="pl-8 text-xs h-9"
                  />
                  {addAssignmentSearch && (
                    <button
                      type="button"
                      onClick={() => setAddAssignmentSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {filteredAssignments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      {assignmentsList.length === 0
                        ? "No assignments available. Create an assignment in Assignments workspace first."
                        : `No assignments matching "${addAssignmentSearch}".`}
                    </p>
                  ) : (
                    filteredAssignments.map((asg) => {
                      const isSelected = selectedAssignmentId === asg.id;
                      return (
                        <div
                          key={asg.id}
                          onClick={() => setCntValue("assignmentId", asg.id, { shouldValidate: true })}
                          role="button"
                          tabIndex={0}
                          className={`flex items-start justify-between p-2.5 rounded-lg border text-left cursor-pointer transition ${
                            isSelected
                              ? "border-brand-500 bg-blue-50/70 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <GraduationCap
                                size={14}
                                className={isSelected ? "text-brand-600" : "text-slate-400"}
                              />
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isSelected ? "text-brand-900" : "text-slate-800"
                                }`}
                              >
                                {asg.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span
                                className={`px-1.5 py-0.5 rounded font-medium ${
                                  asg.submissionPolicy === "RESUBMITTABLE"
                                    ? "bg-purple-50 text-purple-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {asg.submissionPolicy === "RESUBMITTABLE"
                                  ? "Resubmissions Allowed"
                                  : "Single Attempt"}
                              </span>
                              {asg.dueAt && (
                                <span>Due: {new Date(asg.dueAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-white shrink-0 mt-0.5">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {cntErrors.assignmentId?.message && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {cntErrors.assignmentId.message}
                  </p>
                )}
              </div>
            )}

            <FormField label="Order in Module" error={cntErrors.order?.message}>
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

      {/* Edit Content Item Modal */}
      <Dialog
        open={Boolean(editContentItem)}
        onOpenChange={(open) => !open && setEditContentItem(null)}
      >
        <DialogCloseButton onClose={() => setEditContentItem(null)} />
        <form onSubmit={handleEditCntSubmit(onEditContent)}>
          <DialogHeader>
            <DialogTitle>Edit Lesson Content</DialogTitle>
            <DialogDescription>Modify lesson instructions, link URL, or body text.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Lesson Title" required error={editCntErrors.title?.message}>
              <Input {...regEditCnt("title")} placeholder="Lesson title" />
            </FormField>

            <FormField label="Content Type" error={editCntErrors.type?.message}>
              <Select {...regEditCnt("type")}>
                <option value="TEXT">Text Reading (Markdown)</option>
                <option value="VIDEO">Direct Video URL</option>
                <option value="YOUTUBE_VIDEO">YouTube Embed</option>
                <option value="LINK">External Link</option>
                <option value="ASSIGNMENT">Assignment Association</option>
              </Select>
            </FormField>

            <FormField label="Brief Overview (optional)" error={editCntErrors.description?.message}>
              <Input {...regEditCnt("description")} placeholder="Short summary..." />
            </FormField>

            {selectedEditContentType === "TEXT" && (
              <FormField
                label="Lesson Body (Markdown supported)"
                required
                error={editCntErrors.body?.message}
              >
                <Textarea {...regEditCnt("body")} rows={5} />
              </FormField>
            )}

            {(selectedEditContentType === "VIDEO" ||
              selectedEditContentType === "YOUTUBE_VIDEO" ||
              selectedEditContentType === "LINK") && (
              <FormField
                label="Resource URL"
                required
                error={editCntErrors.url?.message}
              >
                <Input {...regEditCnt("url")} />
              </FormField>
            )}

            {selectedEditContentType === "ASSIGNMENT" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Associated Assignment <span className="text-red-500">*</span>
                  </label>
                  {selectedEditAssignmentId && (
                    <span className="text-[11px] font-normal text-emerald-600 font-mono truncate max-w-[200px]">
                      Selected: {assignmentsList.find((a) => a.id === selectedEditAssignmentId)?.title || selectedEditAssignmentId.slice(0, 8)}
                    </span>
                  )}
                </div>

                <input type="hidden" {...regEditCnt("assignmentId")} />

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={editAssignmentSearch}
                    onChange={(e) => setEditAssignmentSearch(e.target.value)}
                    placeholder="Search assignment by title or policy..."
                    className="pl-8 text-xs h-9"
                  />
                  {editAssignmentSearch && (
                    <button
                      type="button"
                      onClick={() => setEditAssignmentSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {filteredEditAssignments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      {assignmentsList.length === 0
                        ? "No assignments available."
                        : `No assignments matching "${editAssignmentSearch}".`}
                    </p>
                  ) : (
                    filteredEditAssignments.map((asg) => {
                      const isSelected = selectedEditAssignmentId === asg.id;
                      return (
                        <div
                          key={asg.id}
                          onClick={() => setEditCntValue("assignmentId", asg.id, { shouldValidate: true })}
                          role="button"
                          tabIndex={0}
                          className={`flex items-start justify-between p-2.5 rounded-lg border text-left cursor-pointer transition ${
                            isSelected
                              ? "border-brand-500 bg-blue-50/70 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <GraduationCap
                                size={14}
                                className={isSelected ? "text-brand-600" : "text-slate-400"}
                              />
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isSelected ? "text-brand-900" : "text-slate-800"
                                }`}
                              >
                                {asg.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span
                                className={`px-1.5 py-0.5 rounded font-medium ${
                                  asg.submissionPolicy === "RESUBMITTABLE"
                                    ? "bg-purple-50 text-purple-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {asg.submissionPolicy === "RESUBMITTABLE"
                                  ? "Resubmissions Allowed"
                                  : "Single Attempt"}
                              </span>
                              {asg.dueAt && (
                                <span>Due: {new Date(asg.dueAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-white shrink-0 mt-0.5">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {editCntErrors.assignmentId?.message && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {editCntErrors.assignmentId.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditContentItem(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateContentMutation.isPending}>
              {updateContentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Content Item Dialog */}
      <ConfirmDialog
        open={Boolean(deleteContentId)}
        onOpenChange={(open) => !open && setDeleteContentId(null)}
        title="Delete Lesson"
        description="Are you sure you want to permanently remove this lesson from the module? This cannot be undone."
        confirmLabel="Delete Lesson"
        isLoading={deleteContentMutation.isPending}
        onConfirm={() => {
          if (deleteContentId) {
            deleteContentMutation.mutate(deleteContentId, {
              onSuccess: () => setDeleteContentId(null),
              onError: (err: unknown) => {
                setActionError(err instanceof Error ? err.message : "Failed to delete lesson");
              },
            });
          }
        }}
      />
    </DashboardShell>
  );
}
