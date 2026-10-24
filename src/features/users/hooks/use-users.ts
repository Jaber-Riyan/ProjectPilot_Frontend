"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { userService } from "@/lib/services/user.service";
import { useSession } from "@/hooks/use-session";
import type { PaginationParams } from "@/types/common";
import type { User } from "@/types/domain";

export function useUsers(params?: PaginationParams & { role?: string }) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.users.list({ ...params, currentUserId: user?.id, userRole: user?.role }),
    queryFn: () => userService.list(params, user),
  });
}

export function useUser(id: string) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getById(id, user),
    enabled: Boolean(id),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      userService.update(id, updates, user),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
    },
  });
}
