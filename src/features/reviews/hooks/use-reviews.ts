"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { reviewService } from "@/lib/services/review.service";
import { useSession } from "@/hooks/use-session";
import type { Review, SubmissionStatus, ReviewQueueFilters } from "@/types/domain";

export function useReviewBySubmission(submissionId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.bySubmission(submissionId),
    queryFn: () => reviewService.getBySubmissionId(submissionId),
    enabled: Boolean(submissionId),
  });
}

export function useReviewQueue(filters?: ReviewQueueFilters) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.reviews.queue(filters as Record<string, unknown> | undefined),
    queryFn: () => reviewService.getReviewQueue(filters, user),
    enabled: Boolean(user && (user.role === "MENTOR" || user.role === "ADMIN")),
  });
}

export function useReviewSubmissionDetail(submissionId: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: [...queryKeys.reviews.all(), "submissionDetail", submissionId],
    queryFn: () => reviewService.getSubmissionDetailForReview(submissionId, user),
    enabled: Boolean(submissionId && user && (user.role === "MENTOR" || user.role === "ADMIN")),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: (input: {
      submissionId: string;
      feedback: string;
      status: SubmissionStatus;
      score?: number;
    }) => reviewService.create(input, user),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.submissions.detail(variables.submissionId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Review, "id" | "createdAt">> & { submissionId?: string };
    }) => reviewService.update(id, updates, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
  });
}
