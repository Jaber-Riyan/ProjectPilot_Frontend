import React from "react";
import { Badge } from "@/components/ui/badge";

type EntityStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED"
  | "CLOSED"
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMISSION_REQUESTED"
  | "ACTIVE"
  | "INACTIVE"
  | "STUDENT"
  | "MENTOR"
  | "ADMIN"
  | string;

interface StatusBadgeProps {
  status: EntityStatus;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }
> = {
  // Course & Assignment
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Published", variant: "success" },
  ARCHIVED: { label: "Archived", variant: "outline" },
  CLOSED: { label: "Closed", variant: "destructive" },

  // Submission
  PENDING: { label: "Pending Review", variant: "warning" },
  UNDER_REVIEW: { label: "Under Review", variant: "default" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Needs Revision", variant: "destructive" },
  RESUBMISSION_REQUESTED: { label: "Resubmission Requested", variant: "warning" },

  // User status
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "secondary" },

  // Roles
  STUDENT: { label: "Student", variant: "secondary" },
  MENTOR: { label: "Mentor", variant: "default" },
  ADMIN: { label: "Admin", variant: "warning" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  const config = statusConfig[normalized] ?? { label: status, variant: "secondary" };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
