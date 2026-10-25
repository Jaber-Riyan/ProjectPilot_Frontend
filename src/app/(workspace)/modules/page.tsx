"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Layers,
  Plus,
  Trash2,
  Edit,
  BookOpen,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
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
import { DetailLoadingSkeleton } from "@/components/feedback/loading-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { AccessDenied } from "@/components/access/access-denied";
import { useSession } from "@/hooks/use-session";
import {
  useModulesLibrary,
  useCreateIndependentModule,
  useUpdateModule,
  useDeleteModule,
} from "@/features/modules/hooks/use-modules";
import {
  createIndependentModuleSchema,
  updateModuleSchema,
  type CreateIndependentModuleFormValues,
  type UpdateModuleFormValues,
} from "@/features/modules/schemas/module.schema";
import type { ModuleWithCount } from "@/types/domain";

export default function ModulesLibraryPage() {
  const { user } = useSession();
  const isMentorOrAdmin = user?.role === "MENTOR" || user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [filterPublished, setFilterPublished] = useState<string>("ALL");

  // Format filter query param
  const isPublishedParam =
    filterPublished === "PUBLISHED" ? true : filterPublished === "DRAFT" ? false : undefined;

  const {
    data: libraryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useModulesLibrary({
    page,
    limit: 12,
    isPublished: isPublishedParam,
  });

  const createMutation = useCreateIndependentModule();
  const updateMutation = useUpdateModule();
  const deleteMutation = useDeleteModule();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editModule, setEditModule] = useState<ModuleWithCount | null>(null);
  const [deleteModule, setDeleteModule] = useState<ModuleWithCount | null>(null);

  // Conflict error modal state (for 409 Conflict when deleting attached module)
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Forms
  const {
    register: regCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateIndependentModuleFormValues>({
    resolver: zodResolver(createIndependentModuleSchema),
    defaultValues: {
      title: "",
      description: "",
      isPublished: true,
    },
  });

  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateModuleFormValues>({
    resolver: zodResolver(updateModuleSchema),
  });

  const onCreateModule = (values: CreateIndependentModuleFormValues) => {
    setGeneralError(null);
    createMutation.mutate(
      {
        title: values.title,
        description: values.description || null,
        isPublished: values.isPublished,
      },
      {
        onSuccess: () => {
          resetCreate();
          setCreateOpen(false);
          refetch();
        },
        onError: (err: unknown) => {
          setGeneralError(err instanceof Error ? err.message : "Failed to create module");
        },
      }
    );
  };

  const onEditModule = (values: UpdateModuleFormValues) => {
    if (!editModule) return;
    setGeneralError(null);
    updateMutation.mutate(
      {
        id: editModule.id,
        updates: values,
      },
      {
        onSuccess: () => {
          setEditModule(null);
          refetch();
        },
        onError: (err: unknown) => {
          setGeneralError(err instanceof Error ? err.message : "Failed to update module");
        },
      }
    );
  };

  const onConfirmDelete = () => {
    if (!deleteModule) return;
    setGeneralError(null);
    setConflictError(null);

    deleteMutation.mutate(deleteModule.id, {
      onSuccess: () => {
        setDeleteModule(null);
        refetch();
      },
      onError: (err: unknown) => {
        const errorMsg = err instanceof Error ? err.message : "Failed to delete module";
        setDeleteModule(null);
        // Check for 409 Conflict / attached to course error
        if (
          errorMsg.toLowerCase().includes("attached") ||
          errorMsg.toLowerCase().includes("conflict")
        ) {
          setConflictError(
            `Cannot delete "${deleteModule.title}" because it is currently attached to one or more courses. Please detach it from all course syllabi before deleting.`
          );
        } else {
          setGeneralError(errorMsg);
        }
      },
    });
  };

  if (user && !isMentorOrAdmin) {
    return (
      <DashboardShell>
        <AccessDenied
          title="Module Management Restricted"
          description="Only mentors and administrators can access the independent module library and curriculum management tools."
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Modules Library"
        description="Browse, author, and manage reusable curriculum units and lessons across all platform courses."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Modules Library" },
        ]}
        actions={
          isMentorOrAdmin ? (
            <Button
              size="sm"
              onClick={() => {
                setGeneralError(null);
                resetCreate({
                  title: "",
                  description: "",
                  isPublished: true,
                });
                setCreateOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus size={15} /> Create Module
            </Button>
          ) : undefined
        }
      />

      {/* Conflict Error Alert */}
      {conflictError && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm">
          <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block mb-1">Module Deletion Blocked (409 Conflict)</strong>
            <p className="text-xs text-amber-800">{conflictError}</p>
          </div>
          <button
            onClick={() => setConflictError(null)}
            className="text-xs text-amber-700 hover:text-amber-900 font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* General Error Alert */}
      {generalError && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">
          <div className="flex-1">
            <strong>Error:</strong> {generalError}
          </div>
          <button
            onClick={() => setGeneralError(null)}
            className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-600">Status Filter:</span>
          <Select
            value={filterPublished}
            onChange={(e) => {
              setFilterPublished(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs w-36"
          >
            <option value="ALL">All Modules</option>
            <option value="PUBLISHED">Published Only</option>
            {isMentorOrAdmin && <option value="DRAFT">Drafts Only</option>}
          </Select>
        </div>

        {libraryData && (
          <p className="text-xs text-slate-500">
            Showing <strong>{libraryData.items?.length || 0}</strong> of{" "}
            <strong>{libraryData.total || 0}</strong> total modules
          </p>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <DetailLoadingSkeleton />
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center text-xs text-red-700">
          Failed to load modules library: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : libraryData?.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400 mx-auto">
            <Layers size={22} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No Modules Found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {filterPublished !== "ALL"
              ? "No modules match the selected filter criteria."
              : "No independent modules have been authored yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {libraryData?.items.map((mod) => (
            <div
              key={mod.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-card hover:shadow-card-hover transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{mod.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase shrink-0 ${
                      mod.isPublished
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {mod.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
                  {mod.description || "No description provided."}
                </p>
              </div>

              <div>
                {/* Meta badges */}
                <div className="flex items-center gap-4 py-2 border-t border-slate-100 text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1.5" title="Lessons in this module">
                    <FileText size={14} className="text-slate-400" />
                    <span>{mod._count?.contentItems ?? 0} Lessons</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Courses using this module">
                    <BookOpen size={14} className="text-slate-400" />
                    <span>{mod._count?.courseModules ?? 0} Courses</span>
                  </div>
                </div>

                {/* Actions */}
                {isMentorOrAdmin && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setGeneralError(null);
                        setConflictError(null);
                        setEditModule(mod);
                        resetEdit({
                          title: mod.title,
                          description: mod.description || "",
                          isPublished: mod.isPublished,
                        });
                      }}
                      className="h-8 text-xs gap-1 text-slate-600 hover:text-slate-900"
                    >
                      <Edit size={13} /> Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setGeneralError(null);
                        setConflictError(null);
                        setDeleteModule(mod);
                      }}
                      className="h-8 text-xs gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={13} /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {libraryData && libraryData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8">
          <Button
            size="sm"
            variant="outline"
            disabled={!libraryData.hasPrevPage}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="gap-1 text-xs"
          >
            <ChevronLeft size={14} /> Previous
          </Button>

          <span className="text-xs text-slate-500 font-medium">
            Page {libraryData.page} of {libraryData.totalPages}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={!libraryData.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
            className="gap-1 text-xs"
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Create Module Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogCloseButton onClose={() => setCreateOpen(false)} />
        <form onSubmit={handleCreateSubmit(onCreateModule)}>
          <DialogHeader>
            <DialogTitle>Create Independent Module</DialogTitle>
            <DialogDescription>
              Author a new curriculum unit in the module library. You can attach it to courses anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Module Title" required error={createErrors.title?.message}>
              <Input {...regCreate("title")} placeholder="e.g. Relational Databases & SQL" />
            </FormField>

            <FormField label="Description" error={createErrors.description?.message}>
              <Textarea
                {...regCreate("description")}
                rows={3}
                placeholder="Overview of topics and lessons covered..."
              />
            </FormField>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="createIsPublished"
                {...regCreate("isPublished")}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="createIsPublished" className="text-xs font-medium text-slate-700">
                Publish module (available to attach to active courses)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Module"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Module Modal */}
      <Dialog open={Boolean(editModule)} onOpenChange={(open) => !open && setEditModule(null)}>
        <DialogCloseButton onClose={() => setEditModule(null)} />
        <form onSubmit={handleEditSubmit(onEditModule)}>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>Update title, syllabus description, and publication state.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Module Title" required error={editErrors.title?.message}>
              <Input {...regEdit("title")} placeholder="Module title" />
            </FormField>

            <FormField label="Description" error={editErrors.description?.message}>
              <Textarea {...regEdit("description")} rows={3} />
            </FormField>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editIsPublished"
                {...regEdit("isPublished")}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="editIsPublished" className="text-xs font-medium text-slate-700">
                Published
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditModule(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Module Dialog */}
      <ConfirmDialog
        open={Boolean(deleteModule)}
        onOpenChange={(open) => !open && setDeleteModule(null)}
        title="Delete Module"
        description={`Are you sure you want to permanently delete "${deleteModule?.title}"? Note: If this module is currently attached to any course, deletion will be rejected (409 Conflict) until detached.`}
        confirmLabel="Delete Module"
        isLoading={deleteMutation.isPending}
        onConfirm={onConfirmDelete}
      />
    </DashboardShell>
  );
}
