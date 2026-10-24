import { PERMISSIONS } from "@/lib/access/permissions";

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type RolePermissionsMap = {
  readonly [role in "STUDENT" | "MENTOR" | "ADMIN"]: readonly Permission[];
};

export interface RouteAccessRule {
  /** The permissions required to access the route. User needs at least one (or all, depending on requireAll). */
  permissions: readonly Permission[];
  /** If true, user must have all specified permissions. Defaults to false (any permission satisfies). */
  requireAll?: boolean;
  /** Optional custom check or redirect target */
  redirectTo?: string;
  /** Whether guests (unauthenticated users) are allowed */
  allowGuest?: boolean;
}
