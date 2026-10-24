"use client";

import React from "react";
import type { Permission } from "@/types/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useSession } from "@/hooks/use-session";
import { AccessDenied } from "./access-denied";
import { Skeleton } from "@/components/ui/skeleton";

interface RequirePermissionProps {
  permission?: Permission;
  permissions?: readonly Permission[];
  requireAll?: boolean;
  children: React.ReactNode;
}

export function RequirePermission({
  permission,
  permissions,
  requireAll = false,
  children,
}: RequirePermissionProps) {
  const { status } = useSession();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (status === "loading") {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  let authorized = true;
  let missingPermissionName = "";

  if (permission) {
    authorized = hasPermission(permission);
    if (!authorized) missingPermissionName = permission;
  }

  if (authorized && permissions && permissions.length > 0) {
    authorized = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    if (!authorized) missingPermissionName = permissions.join(", ");
  }

  if (!authorized) {
    return <AccessDenied requiredPermission={missingPermissionName} />;
  }

  return <>{children}</>;
}
