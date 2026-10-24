"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { contentService } from "@/lib/services/content.service";
import { useSession } from "@/hooks/use-session";
import type { ContentItem } from "@/types/domain";

export function useContentItems(moduleId?: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.content.list(moduleId),
    queryFn: () => contentService.list(moduleId, user),
  });
}

export function useContentItem(id: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.content.detail(id),
    queryFn: () => contentService.getById(id, user),
    enabled: Boolean(id),
  });
}

export function useCreateContentItem() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (input: Omit<ContentItem, "id" | "createdAt" | "updatedAt">) =>
      contentService.create(input, user),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(variables.moduleId) });
    },
  });
}

export function useUpdateContentItem() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<ContentItem, "id" | "createdAt">>;
    }) => contentService.update(id, updates, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all() });
    },
  });
}

export function useDeleteContentItem() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (id: string) => contentService.delete(id, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
    },
  });
}
