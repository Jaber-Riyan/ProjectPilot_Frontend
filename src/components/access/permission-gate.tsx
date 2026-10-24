"use client";

import React from "react";
import type { Permission } from "@/types/permissions";
import { usePermissions } from "@/hooks/use-permissions";

interface PermissionGateProps {
  permission?: Permission;
  permissions?: readonly Permission[];
  requireAll?: boolean;
  check?: () => boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  check,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (check && !check()) {
    return <>{fallback}</>;
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const isAllowed = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!isAllowed) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
