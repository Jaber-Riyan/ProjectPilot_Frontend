"use client";

import { useSession } from "./use-session";
import type { Permission } from "@/types/permissions";
import type { Course, Submission, Assignment } from "@/types/domain";
import {
  hasPermission as checkHasPermission,
  hasAnyPermission as checkHasAnyPermission,
  hasAllPermissions as checkHasAllPermissions,
  canAccessCourse as checkCanAccessCourse,
  canAccessSubmission as checkCanAccessSubmission,
  canAccessAssignment as checkCanAccessAssignment,
} from "@/lib/access/access-control";
import { canAccessRoute as checkCanAccessRoute } from "@/lib/access/route-access";

export function usePermissions() {
  const { user, role, isAuthenticated } = useSession();

  return {
    user,
    role,
    isAuthenticated,
    isStudent: role === "STUDENT",
    isMentor: role === "MENTOR",
    isAdmin: role === "ADMIN",
    isGuest: !user,

    hasPermission: (permission: Permission) => checkHasPermission(user, permission),
    can: (permission: Permission) => checkHasPermission(user, permission),
    hasAnyPermission: (permissions: readonly Permission[]) => checkHasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: readonly Permission[]) => checkHasAllPermissions(user, permissions),

    canAccessRoute: (pathname: string) => checkCanAccessRoute(user, pathname),
    canAccessCourse: (course: Course, action: "view" | "edit" | "delete" = "view") =>
      checkCanAccessCourse(user, course, action),
    canAccessSubmission: (submission: Submission, course?: Course) =>
      checkCanAccessSubmission(user, submission, course),
    canAccessAssignment: (
      assignment: Assignment,
      course?: Course,
      action: "view" | "edit" | "delete" = "view"
    ) => checkCanAccessAssignment(user, assignment, course, action),
  };
}
