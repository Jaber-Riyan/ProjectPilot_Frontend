export const queryKeys = {
  all: ["projectpilot"] as const,

  auth: {
    me: () => [...queryKeys.all, "auth", "me"] as const,
  },

  courses: {
    all: () => [...queryKeys.all, "courses"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.courses.all(), "list", params ?? {}] as const,
    detail: (idOrSlug: string) =>
      [...queryKeys.courses.all(), "detail", idOrSlug] as const,
  },

  modules: {
    all: () => [...queryKeys.all, "modules"] as const,
    list: (courseId?: string) =>
      [...queryKeys.modules.all(), "list", courseId ?? "all"] as const,
    byCourse: (courseId: string) =>
      [...queryKeys.modules.all(), "byCourse", courseId] as const,
    library: (params?: Record<string, unknown>) =>
      [...queryKeys.modules.all(), "library", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.modules.all(), "detail", id] as const,
  },

  content: {
    all: () => [...queryKeys.all, "content"] as const,
    list: (moduleId?: string) =>
      [...queryKeys.content.all(), "list", moduleId ?? "all"] as const,
    byModule: (moduleId: string) =>
      [...queryKeys.content.all(), "byModule", moduleId] as const,
    detail: (id: string) => [...queryKeys.content.all(), "detail", id] as const,
  },

  assignments: {
    all: () => [...queryKeys.all, "assignments"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.assignments.all(), "list", params ?? {}] as const,
    detail: (id: string) =>
      [...queryKeys.assignments.all(), "detail", id] as const,
  },

  submissions: {
    all: () => [...queryKeys.all, "submissions"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.submissions.all(), "list", params ?? {}] as const,
    detail: (id: string) =>
      [...queryKeys.submissions.all(), "detail", id] as const,
    attempts: (assignmentId: string, studentId: string) =>
      [...queryKeys.submissions.all(), "attempts", assignmentId, studentId] as const,
  },

  reviews: {
    all: () => [...queryKeys.all, "reviews"] as const,
    bySubmission: (submissionId: string) =>
      [...queryKeys.reviews.all(), "submission", submissionId] as const,
    queue: (params?: Record<string, unknown>) =>
      [...queryKeys.reviews.all(), "queue", params ?? {}] as const,
  },

  users: {
    all: () => [...queryKeys.all, "users"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.users.all(), "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.users.all(), "detail", id] as const,
  },
};
