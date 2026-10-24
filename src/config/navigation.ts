import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Users,
} from "lucide-react";
import type { Permission } from "@/types/permissions";
import { PERMISSIONS } from "@/lib/access/permissions";
import type { CurrentUser } from "@/types/auth";
import { hasAllPermissions, hasAnyPermission } from "@/lib/access/access-control";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredPermissions?: readonly Permission[];
  requireAllPermissions?: boolean;
  roleScope?: ("STUDENT" | "MENTOR" | "ADMIN")[];
  badge?: string;
  exact?: boolean;
}

export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  {
    label: "Courses",
    href: "/courses",
    icon: BookOpen,
    requiredPermissions: [PERMISSIONS.COURSE_READ],
  },
  {
    label: "Assignments",
    href: "/assignments",
    icon: GraduationCap,
    requiredPermissions: [PERMISSIONS.ASSIGNMENT_READ],
  },
  {
    label: "Submissions",
    href: "/submissions",
    icon: ClipboardCheck,
    requiredPermissions: [
      PERMISSIONS.SUBMISSION_READ_OWN,
      PERMISSIONS.SUBMISSION_READ_ASSIGNED,
      PERMISSIONS.SUBMISSION_READ_ALL,
    ],
  },
  {
    label: "Users & Access",
    href: "/users",
    icon: Users,
    requiredPermissions: [PERMISSIONS.USER_READ, PERMISSIONS.USER_MANAGE],
  },
];

/**
 * Filter navigation items according to current user's permissions and role.
 */
export function getAuthorizedNavigation(user: CurrentUser | null): NavigationItem[] {
  if (!user) return [];

  return MAIN_NAVIGATION.filter((item) => {
    // Check role scope if present
    if (item.roleScope && !item.roleScope.includes(user.role)) {
      return false;
    }

    // Check permissions
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }

    if (item.requireAllPermissions) {
      return hasAllPermissions(user, item.requiredPermissions);
    }

    return hasAnyPermission(user, item.requiredPermissions);
  });
}
