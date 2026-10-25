"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { moduleService } from "@/lib/services/module.service";
import { useSession } from "@/hooks/use-session";
import type {
  CourseModule,
  AttachOrAddModuleInput,
  CreateModuleInput,
  UpdateModuleInput,
} from "@/types/domain";
import type { PaginationParams } from "@/types/common";

/**
 * Lists modules attached to a specific course.
 */
export function useCourseModules(courseId?: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: courseId ? queryKeys.modules.byCourse(courseId) : queryKeys.modules.all(),
    queryFn: () => (courseId ? moduleService.listByCourse(courseId, user) : []),
    enabled: Boolean(courseId),
  });
}

/**
 * Backward-compatible module list hook.
 */
export function useModules(courseId?: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.modules.list(courseId),
    queryFn: () => moduleService.list(courseId, user),
  });
}

/**
 * Queries the independent modules library with pagination and filters.
 */
export function useModulesLibrary(params?: PaginationParams & { isPublished?: boolean }) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.modules.library(params as Record<string, unknown>),
    queryFn: () => moduleService.listLibrary(params, user),
  });
}

/**
 * Retrieves a single module by ID with content items and course associations.
 */
export function useModule(id: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.modules.detail(id),
    queryFn: () => moduleService.getById(id, user),
    enabled: Boolean(id),
  });
}

/**
 * Attaches an existing module or creates and attaches a new module to a course.
 */
export function useAttachOrAddModule(courseId: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (input: AttachOrAddModuleInput) =>
      moduleService.attachOrAdd(courseId, input, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
}

/**
 * Detaches a module from a course.
 */
export function useDetachModule(courseId: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (moduleId: string) => moduleService.detach(courseId, moduleId, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
}

/**
 * Reorders modules within a course.
 */
export function useReorderCourseModules(courseId: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (moduleIds: string[]) => moduleService.reorder(courseId, moduleIds, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    },
  });
}

/**
 * Creates an independent module.
 */
export function useCreateIndependentModule() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (input: CreateModuleInput) => moduleService.create(input, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
    },
  });
}

/**
 * Legacy create module hook (backward-compatible).
 */
export function useCreateModule() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (input: Omit<CourseModule, "id" | "createdAt" | "updatedAt">) => {
      if (input.courseId) {
        return moduleService.attachOrAdd(
          input.courseId,
          {
            title: input.title,
            description: input.description,
            order: input.order,
          },
          user
        );
      }
      return moduleService.create(input, user);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
      if (variables.courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(variables.courseId) });
      }
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateModuleInput;
    }) => moduleService.update(id, updates, user),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (id: string) => moduleService.delete(id, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
}
