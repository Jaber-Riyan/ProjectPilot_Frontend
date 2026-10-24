"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { courseService } from "@/lib/services/course.service";
import { useSession } from "@/hooks/use-session";
import type { PaginationParams } from "@/types/common";
import type { Course } from "@/types/domain";

export function useCourses(params?: PaginationParams) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.courses.list({ ...params, userId: user?.id, userRole: user?.role }),
    queryFn: () => courseService.list(params, user),
  });
}

export function useCourse(idOrSlug: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.courses.detail(idOrSlug),
    queryFn: () => courseService.getById(idOrSlug, user),
    enabled: Boolean(idOrSlug),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (input: Omit<Course, "id" | "createdAt" | "updatedAt">) =>
      courseService.create(input, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Course, "id" | "createdAt">>;
    }) => courseService.update(id, updates, user),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(variables.id) });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (id: string) => courseService.delete(id, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
}
