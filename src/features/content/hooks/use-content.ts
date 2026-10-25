"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { contentService } from "@/lib/services/content.service";
import { useSession } from "@/hooks/use-session";
import type {
  CreateContentItemInput,
  UpdateContentItemInput,
} from "@/types/domain";

/**
 * Lists content items belonging to a module.
 */
export function useModuleContent(moduleId?: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: moduleId ? queryKeys.content.byModule(moduleId) : queryKeys.content.all(),
    queryFn: () => (moduleId ? contentService.listByModule(moduleId, user) : []),
    enabled: Boolean(moduleId),
  });
}

/**
 * Backward-compatible content items hook.
 */
export function useContentItems(moduleId?: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.content.list(moduleId),
    queryFn: () => contentService.list(moduleId, user),
  });
}

/**
 * Retrieves a single content item by ID.
 */
export function useContentItem(id: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.content.detail(id),
    queryFn: () => contentService.getById(id, user),
    enabled: Boolean(id),
  });
}

/**
 * Creates a content item in a module.
 */
export function useCreateContentItem(defaultModuleId?: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: ({
      moduleId,
      data,
    }: {
      moduleId?: string;
      data: CreateContentItemInput;
    }) => {
      const targetModuleId = moduleId || defaultModuleId;
      if (!targetModuleId) throw new Error("Module ID is required to create a content item.");
      return contentService.create(targetModuleId, data, user);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all() });
      const targetModuleId = variables.moduleId || defaultModuleId;
      if (targetModuleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.content.byModule(targetModuleId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(targetModuleId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
}

/**
 * Updates a content item.
 */
export function useUpdateContentItem() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateContentItemInput;
    }) => contentService.update(id, updates, user),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
}

/**
 * Deletes a content item.
 */
export function useDeleteContentItem(defaultModuleId?: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (id: string) => contentService.delete(id, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all() });
      if (defaultModuleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.content.byModule(defaultModuleId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(defaultModuleId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
}

/**
 * Reorders content items within a module.
 */
export function useReorderContentItems(moduleId: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (contentItemIds: string[]) =>
      contentService.reorder(moduleId, contentItemIds, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.byModule(moduleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(moduleId) });
    },
  });
}
