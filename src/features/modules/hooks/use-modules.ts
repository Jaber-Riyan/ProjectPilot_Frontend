"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { moduleService } from "@/lib/services/module.service";
import { useSession } from "@/hooks/use-session";
import type { CourseModule } from "@/types/domain";

export function useModules(courseId?: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.modules.list(courseId),
    queryFn: () => moduleService.list(courseId, user),
  });
}

export function useModule(id: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.modules.detail(id),
    queryFn: () => moduleService.getById(id, user),
    enabled: Boolean(id),
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (input: Omit<CourseModule, "id" | "createdAt" | "updatedAt">) =>
      moduleService.create(input, user),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(variables.courseId) });
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
      updates: Partial<Omit<CourseModule, "id" | "createdAt">>;
    }) => moduleService.update(id, updates, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all() });
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
