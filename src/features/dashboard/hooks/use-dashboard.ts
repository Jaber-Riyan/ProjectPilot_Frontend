"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import {
  dashboardService,
  type StudentDashboardQuery,
  type StudentSubmissionsFilterParams,
  type MentorDashboardQuery,
  type MentorSubmissionsFilterParams,
  type MentorCoursesFilterParams,
  type AdminDashboardQuery,
  type AdminUsersFilterParams,
  type AdminSubmissionsFilterParams,
} from "@/lib/services/dashboard.service";
import { useSession } from "@/hooks/use-session";

export function useStudentDashboard(params?: StudentDashboardQuery) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.dashboard.student(params as Record<string, unknown> | undefined),
    queryFn: () => dashboardService.getStudentDashboard(params, user),
    enabled: Boolean(user && user.role === "STUDENT"),
  });
}

export function useStudentSubmissions(params?: StudentSubmissionsFilterParams) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.dashboard.studentSubmissions(params as Record<string, unknown> | undefined),
    queryFn: () => dashboardService.getStudentSubmissions(params, user),
    enabled: Boolean(user && user.role === "STUDENT"),
  });
}

export function useMentorDashboard(params?: MentorDashboardQuery) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.dashboard.mentor(params as Record<string, unknown> | undefined),
    queryFn: () => dashboardService.getMentorDashboard(params, user),
    enabled: Boolean(user && user.role === "MENTOR"),
  });
}

export function useMentorSubmissions(params?: MentorSubmissionsFilterParams) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.dashboard.mentorSubmissions(params as Record<string, unknown> | undefined),
    queryFn: () => dashboardService.getMentorSubmissions(params, user),
    enabled: Boolean(user && user.role === "MENTOR"),
  });
}

export function useMentorCourses(params?: MentorCoursesFilterParams) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.dashboard.mentorCourses(params as Record<string, unknown> | undefined),
    queryFn: () => dashboardService.getMentorCourses(params, user),
    enabled: Boolean(user && user.role === "MENTOR"),
  });
}

export function useAdminDashboard(params?: AdminDashboardQuery) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.dashboard.admin(params as Record<string, unknown> | undefined),
    queryFn: () => dashboardService.getAdminDashboard(params, user),
    enabled: Boolean(user && user.role === "ADMIN"),
  });
}

export function useAdminUsers(params?: AdminUsersFilterParams) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.dashboard.adminUsers(params as Record<string, unknown> | undefined),
    queryFn: () => dashboardService.getAdminUsers(params, user),
    enabled: Boolean(user && user.role === "ADMIN"),
  });
}

export function useAdminSubmissions(params?: AdminSubmissionsFilterParams) {
  const { user } = useSession();

  return useQuery({
    queryKey: queryKeys.dashboard.adminSubmissions(params as Record<string, unknown> | undefined),
    queryFn: () => dashboardService.getAdminSubmissions(params, user),
    enabled: Boolean(user && user.role === "ADMIN"),
  });
}
