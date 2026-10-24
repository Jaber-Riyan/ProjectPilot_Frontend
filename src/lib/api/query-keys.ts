export const queryKeys = {
  all: ["projectpilot"] as const,
  auth: {
    me: () => [...queryKeys.all, "auth", "me"] as const
  },
  courses: {
    all: () => [...queryKeys.all, "courses"] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.courses.all(), "list", params ?? {}] as const,
    detail: (idOrSlug: string) => [...queryKeys.courses.all(), "detail", idOrSlug] as const
  },
  submissions: {
    all: () => [...queryKeys.all, "submissions"] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.submissions.all(), "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.submissions.all(), "detail", id] as const
  }
};
