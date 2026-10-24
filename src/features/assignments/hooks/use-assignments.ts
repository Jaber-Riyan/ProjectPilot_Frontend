"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { assignmentService } from "@/lib/services/assignment.service";
import { useSession } from "@/hooks/use-session";
import type { PaginationParams } from "@/types/common";
import type { Assignment } from "@/types/domain";

export function useAssignments(params?: PaginationParams & { courseId?: string }) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.assignments.list({ ...params, userId: user?.id, userRole: user?.role }),
    queryFn: () => assignmentService.list(params, user),
  });
}

export function useAssignment(id: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.assignments.detail(id),
    queryFn: () => assignmentService.getById(id, user),
    enabled: Boolean(id),
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (input: Omit<Assignment, "id" | "createdAt" | "updatedAt">) =>
      assignmentService.create(input, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all() });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Assignment, "id" | "createdAt">>;
    }) => assignmentService.update(id, updates, user),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.detail(variables.id) });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (id: string) => assignmentService.delete(id, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all() });
    },
  });
}
