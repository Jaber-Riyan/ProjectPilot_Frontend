export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  COURSE_READ: "course:read",
  COURSE_CREATE: "course:create",
  COURSE_UPDATE: "course:update",
  COURSE_DELETE: "course:delete",

  MODULE_READ: "module:read",
  MODULE_CREATE: "module:create",
  MODULE_UPDATE: "module:update",
  MODULE_DELETE: "module:delete",

  CONTENT_READ: "content:read",
  CONTENT_CREATE: "content:create",
  CONTENT_UPDATE: "content:update",
  CONTENT_DELETE: "content:delete",

  ASSIGNMENT_READ: "assignment:read",
  ASSIGNMENT_CREATE: "assignment:create",
  ASSIGNMENT_UPDATE: "assignment:update",
  ASSIGNMENT_DELETE: "assignment:delete",

  SUBMISSION_READ_OWN: "submission:read-own",
  SUBMISSION_CREATE: "submission:create",
  SUBMISSION_READ_ASSIGNED: "submission:read-assigned",
  SUBMISSION_READ_ALL: "submission:read-all",

  REVIEW_CREATE: "review:create",
  REVIEW_UPDATE: "review:update",

  USER_READ: "user:read",
  USER_MANAGE: "user:manage",

  REPORT_READ: "report:read",
} as const;
