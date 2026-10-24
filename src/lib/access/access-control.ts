import type { CurrentUser } from "@/types/auth";
import type { Permission } from "@/types/permissions";
import type { Course, Submission, Assignment } from "@/types/domain";
import { ROLE_PERMISSIONS } from "./role-permissions";

/**
 * Checks whether the user has a specific permission based on their assigned role.
 * Missing / unauthenticated users return false.
 */
export function hasPermission(user: CurrentUser | null, permission: Permission): boolean {
  if (!user || !user.role) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role];
  if (!userPermissions) return false;
  return userPermissions.includes(permission);
}

/** Alias for hasPermission */
export const can = hasPermission;

/**
 * Checks whether the user has at least one of the specified permissions.
 */
export function hasAnyPermission(user: CurrentUser | null, permissions: readonly Permission[]): boolean {
  if (!user || !user.role) return false;
  return permissions.some((perm) => hasPermission(user, perm));
}

/**
 * Checks whether the user has all of the specified permissions.
 */
export function hasAllPermissions(user: CurrentUser | null, permissions: readonly Permission[]): boolean {
  if (!user || !user.role) return false;
  if (permissions.length === 0) return true;
  return permissions.every((perm) => hasPermission(user, perm));
}

/**
 * Checks whether a user can perform an action on a specific Course.
 * Supports action: 'view' (default) | 'edit' | 'delete'.
 */
export function canAccessCourse(
  user: CurrentUser | null,
  course: Course,
  action: "view" | "edit" | "delete" = "view"
): boolean {
  if (action === "delete") {
    return user?.role === "ADMIN";
  }

  if (action === "edit") {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    if (user.role === "MENTOR") {
      return course.mentorIds.includes(user.id);
    }
    return false;
  }

  // action === 'view'
  if (user?.role === "ADMIN") return true;
  if (course.status === "PUBLISHED") return true;
  if (user?.role === "MENTOR" && course.mentorIds.includes(user.id)) return true;
  return false;
}

/**
 * Checks whether a user can access a specific Submission.
 * Scoped by role and relationship:
 * - Admin: global access
 * - Student: own submissions only
 * - Mentor: submissions belonging to courses they are assigned to
 */
export function canAccessSubmission(
  user: CurrentUser | null,
  submission: Submission,
  course?: Course
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;

  if (user.role === "STUDENT") {
    return submission.studentId === user.id;
  }

  if (user.role === "MENTOR") {
    if (course) {
      return course.mentorIds.includes(user.id);
    }
    // If course object is not provided, allow if mentor has review permission
    // and let service layer enforce database course scoping
    return hasPermission(user, "submission:read-assigned");
  }

  return false;
}

/**
 * Checks whether a user can access or manage an Assignment.
 */
export function canAccessAssignment(
  user: CurrentUser | null,
  assignment: Assignment,
  course?: Course,
  action: "view" | "edit" | "delete" = "view"
): boolean {
  if (action === "delete") {
    return user?.role === "ADMIN";
  }

  if (action === "edit") {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    if (user.role === "MENTOR") {
      if (assignment.createdById === user.id) return true;
      if (course && course.mentorIds.includes(user.id)) return true;
    }
    return false;
  }

  // action === 'view'
  if (user?.role === "ADMIN") return true;
  if (assignment.status === "PUBLISHED") return true;
  if (user?.role === "MENTOR") {
    if (assignment.createdById === user.id) return true;
    if (course && course.mentorIds.includes(user.id)) return true;
  }
  return false;
}
