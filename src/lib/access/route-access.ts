import type { CurrentUser } from "@/types/auth";
import type { RouteAccessRule } from "@/types/permissions";
import { PERMISSIONS } from "./permissions";
import { hasAnyPermission, hasAllPermissions } from "./access-control";

/**
 * Route access policies mapped by route pattern.
 * Supports static routes and dynamic patterns with [param] segments.
 */
export const ROUTE_ACCESS: Record<string, RouteAccessRule> = {
  "/": {
    permissions: [],
    allowGuest: true,
  },
  "/login": {
    permissions: [],
    allowGuest: true,
  },
  "/register": {
    permissions: [],
    allowGuest: true,
  },
  "/access-denied": {
    permissions: [],
    allowGuest: true,
  },
  "/dashboard": {
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  "/student/dashboard": {
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  "/mentor/dashboard": {
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  "/admin/dashboard": {
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  "/courses": {
    permissions: [PERMISSIONS.COURSE_READ],
  },
  "/courses/new": {
    permissions: [PERMISSIONS.COURSE_CREATE],
  },
  "/courses/[courseId]": {
    permissions: [PERMISSIONS.COURSE_READ],
  },
  "/courses/[courseId]/edit": {
    permissions: [PERMISSIONS.COURSE_UPDATE],
  },
  "/courses/[courseId]/modules": {
    permissions: [PERMISSIONS.MODULE_UPDATE],
  },
  "/assignments": {
    permissions: [PERMISSIONS.ASSIGNMENT_READ],
  },
  "/assignments/new": {
    permissions: [PERMISSIONS.ASSIGNMENT_CREATE],
  },
  "/assignments/[assignmentId]": {
    permissions: [PERMISSIONS.ASSIGNMENT_READ],
  },
  "/assignments/[assignmentId]/edit": {
    permissions: [PERMISSIONS.ASSIGNMENT_UPDATE],
  },
  "/submissions": {
    permissions: [
      PERMISSIONS.SUBMISSION_READ_OWN,
      PERMISSIONS.SUBMISSION_READ_ASSIGNED,
      PERMISSIONS.SUBMISSION_READ_ALL,
    ],
  },
  "/submissions/[submissionId]": {
    permissions: [
      PERMISSIONS.SUBMISSION_READ_OWN,
      PERMISSIONS.SUBMISSION_READ_ASSIGNED,
      PERMISSIONS.SUBMISSION_READ_ALL,
    ],
  },
  "/users": {
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.USER_MANAGE],
  },
  "/users/[userId]": {
    permissions: [PERMISSIONS.USER_READ, PERMISSIONS.USER_MANAGE],
  },
};

/**
 * Matches a URL pathname against a parameterized route pattern like `/courses/[courseId]/edit`.
 */
export function matchRoutePattern(pattern: string, pathname: string): boolean {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("?")[0].split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return false;
  }

  for (let i = 0; i < patternSegments.length; i++) {
    const pSeg = patternSegments[i];
    const uSeg = pathSegments[i];

    if (pSeg.startsWith("[") && pSeg.endsWith("]")) {
      // Dynamic segment, matches any non-empty segment
      if (!uSeg) return false;
      continue;
    }

    if (pSeg !== uSeg) {
      return false;
    }
  }

  return true;
}

/**
 * Finds the matching route rule for a given pathname.
 */
export function findRouteRule(pathname: string): { pattern: string; rule: RouteAccessRule } | null {
  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "") || "/";

  // Exact match first
  if (ROUTE_ACCESS[cleanPath]) {
    return { pattern: cleanPath, rule: ROUTE_ACCESS[cleanPath] };
  }

  // Parameterized match
  for (const [pattern, rule] of Object.entries(ROUTE_ACCESS)) {
    if (pattern.includes("[") && matchRoutePattern(pattern, cleanPath)) {
      return { pattern, rule };
    }
  }

  return null;
}

/**
 * Validates whether a user can access a given pathname.
 * Handles:
 * - Public routes (allowGuest: true)
 * - Guest access on protected routes (denied)
 * - Role-based permission requirements (single or multiple)
 * - Unknown routes (default to requiring authentication if not found)
 */
export function canAccessRoute(user: CurrentUser | null, pathname: string): boolean {
  const match = findRouteRule(pathname);

  // If no rule is defined, treat as protected route requiring at least signed-in user
  if (!match) {
    return Boolean(user);
  }

  const { rule } = match;

  if (rule.allowGuest) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (rule.permissions.length === 0) {
    return true;
  }

  if (rule.requireAll) {
    return hasAllPermissions(user, rule.permissions);
  }

  return hasAnyPermission(user, rule.permissions);
}
