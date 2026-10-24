export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ACCESS_DENIED: "/access-denied",
  DASHBOARD: "/dashboard",

  STUDENT_DASHBOARD: "/student/dashboard",
  MENTOR_DASHBOARD: "/mentor/dashboard",
  ADMIN_DASHBOARD: "/admin/dashboard",

  COURSES: "/courses",
  COURSE_NEW: "/courses/new",
  COURSE_DETAILS: (courseId: string) => `/courses/${courseId}`,
  COURSE_EDIT: (courseId: string) => `/courses/${courseId}/edit`,
  COURSE_MODULES: (courseId: string) => `/courses/${courseId}/modules`,

  ASSIGNMENTS: "/assignments",
  ASSIGNMENT_NEW: "/assignments/new",
  ASSIGNMENT_DETAILS: (assignmentId: string) => `/assignments/${assignmentId}`,
  ASSIGNMENT_EDIT: (assignmentId: string) => `/assignments/${assignmentId}/edit`,

  SUBMISSIONS: "/submissions",
  SUBMISSION_DETAILS: (submissionId: string) => `/submissions/${submissionId}`,

  USERS: "/users",
  USER_DETAILS: (userId: string) => `/users/${userId}`,
} as const;
