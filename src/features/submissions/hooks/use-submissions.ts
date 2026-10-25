"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { submissionService } from "@/lib/services/submission.service";
import { useSession } from "@/hooks/use-session";
import type { PaginationParams } from "@/types/common";

export function useSubmissions(
  params?: PaginationParams & { assignmentId?: string; status?: string; studentId?: string }
) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.submissions.list({ ...params, userId: user?.id, userRole: user?.role }),
    queryFn: () => submissionService.list(params, user),
  });
}

export function useSubmission(id: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.submissions.detail(id),
    queryFn: () => submissionService.getById(id, user),
    enabled: Boolean(id),
  });
}

export function useSubmissionAttempts(assignmentId: string, studentId: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.submissions.attempts(assignmentId, studentId),
    queryFn: () => submissionService.listAttempts(assignmentId, studentId, user),
    enabled: Boolean(assignmentId && studentId),
  });
}

export interface CreateSubmissionMutationInput {
  assignmentId: string;
  projectName?: string;
  repoUrl?: string;
  liveUrl?: string | null;
  description?: string | null;
  answerText?: string;
  attachmentUrls?: string[];
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (input: CreateSubmissionMutationInput) =>
      submissionService.create(input, user),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all() });
      if (user) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.submissions.attempts(variables.assignmentId, user.id),
        });
      }
    },
  });
}
