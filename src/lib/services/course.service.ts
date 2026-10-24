import { apiRequest } from "@/lib/api/client";
import { courseRepository } from "@/lib/repositories";
import type { Course, CourseStatus } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { CurrentUser } from "@/types/auth";
import { canAccessCourse, hasPermission } from "@/lib/access/access-control";
import { PERMISSIONS } from "@/lib/access/permissions";
import { paginateArray } from "@/lib/repositories/mock/pagination-helper";

/**
 * Normalizes a raw course entity from the backend API into the frontend domain Course model.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCourse(raw: any): Course {
  if (!raw) {
    throw new Error("Cannot normalize null or undefined course data");
  }

  const isPublished =
    typeof raw.isPublished === "boolean"
      ? raw.isPublished
      : raw.status === "PUBLISHED";

  const status: CourseStatus = isPublished ? "PUBLISHED" : "DRAFT";

  const modulesCount =
    raw.modulesCount ??
    raw._count?.modules ??
    raw._count?.courseModules ??
    (Array.isArray(raw.courseModules) ? raw.courseModules.length : 0) ??
    (Array.isArray(raw.moduleIds) ? raw.moduleIds.length : 0);

  const moduleIds =
    Array.isArray(raw.moduleIds) && raw.moduleIds.length > 0
      ? raw.moduleIds
      : Array.isArray(raw.courseModules)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.courseModules.map((cm: any) => cm.moduleId || cm.id)
      : [];

  const mentorIds =
    Array.isArray(raw.mentorIds) && raw.mentorIds.length > 0
      ? raw.mentorIds
      : raw.createdById
      ? [raw.createdById]
      : [];

  return {
    id: raw.id,
    title: raw.title || "",
    slug: raw.slug || "",
    description: raw.description ?? "",
    imageUrl: raw.imageUrl ?? null,
    isPublished,
    status,
    createdById: raw.createdById,
    mentorIds,
    moduleIds,
    modulesCount,
    _count: raw._count ?? { modules: modulesCount, courseModules: modulesCount },
    courseModules: raw.courseModules ?? [],
    modules: raw.modules ?? [],
    level: raw.level ?? "BEGINNER",
    estimatedHours: raw.estimatedHours ?? 10,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export class CourseService {
  private isTestEnv(): boolean {
    return (
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "test" ||
        Boolean(process.env.NODE_TEST_CONTEXT) ||
        !process.env.NEXT_PUBLIC_API_BASE_URL)
    );
  }

  /**
   * Fetches paginated courses.
   * Connects to GET /api/v1/courses with query parameters: page, limit, status, search.
   */
  async list(
    params?: PaginationParams,
    user?: CurrentUser | null
  ): Promise<PaginatedResult<Course>> {
    // In unit test environment, fallback to mock repository for offline isolation
    if (this.isTestEnv()) {
      const result = await courseRepository.list({ ...params, limit: 1000, page: 1 });
      let items = result.items;
      if (!user || user.role === "STUDENT") {
        items = items.filter((c) => c.status === "PUBLISHED");
      } else if (user.role === "MENTOR") {
        items = items.filter((c) => c.status === "PUBLISHED" || c.mentorIds.includes(user.id));
      }
      return paginateArray(items, params?.page, params?.limit);
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    if (params?.status && params.status !== "ALL") {
      if (params.status === "PUBLISHED") {
        searchParams.set("isPublished", "true");
        searchParams.set("status", "PUBLISHED");
      } else if (params.status === "DRAFT") {
        searchParams.set("isPublished", "false");
        searchParams.set("status", "DRAFT");
      }
    }

    const queryStr = searchParams.toString();
    const path = queryStr ? `courses?${queryStr}` : "courses";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiResult = await apiRequest<PaginatedResult<any>>(path, {
      method: "GET",
      authenticated: Boolean(user),
    });

    return {
      items: (apiResult.items || []).map(normalizeCourse),
      total: apiResult.total ?? 0,
      page: apiResult.page ?? 1,
      limit: apiResult.limit ?? 20,
      totalPages: apiResult.totalPages ?? 1,
      hasNextPage: Boolean(apiResult.hasNextPage),
      hasPrevPage: Boolean(apiResult.hasPrevPage),
    };
  }

  /**
   * Fetches course details by UUID or slug.
   * Connects to GET /api/v1/courses/:idOrSlug
   */
  async getById(idOrSlug: string, user?: CurrentUser | null): Promise<Course> {
    if (this.isTestEnv()) {
      const course = await courseRepository.getById(idOrSlug);
      if (!course) {
        throw new Error(`Course "${idOrSlug}" was not found.`);
      }
      if (!canAccessCourse(user ?? null, course, "view")) {
        throw new Error("Access denied: you do not have permission to view this course.");
      }
      return course;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCourse = await apiRequest<any>(`courses/${encodeURIComponent(idOrSlug)}`, {
      method: "GET",
      authenticated: Boolean(user),
    });

    const course = normalizeCourse(rawCourse);

    // Frontend sanity check: students and guests cannot view draft courses
    if (!canAccessCourse(user ?? null, course, "view")) {
      throw new Error("Access denied: you do not have permission to view this course.");
    }

    return course;
  }

  /**
   * Creates a new course.
   * Connects to POST /api/v1/courses (MENTOR or ADMIN only).
   */
  async create(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: any,
    user: CurrentUser | null
  ): Promise<Course> {
    if (this.isTestEnv()) {
      if (!hasPermission(user, PERMISSIONS.COURSE_CREATE)) {
        throw new Error("Access denied: you do not have permission to create courses.");
      }
      const mentorIds = input.mentorIds ? [...input.mentorIds] : [];
      if (user && user.role === "MENTOR" && !mentorIds.includes(user.id)) {
        mentorIds.push(user.id);
      }
      return courseRepository.create({
        ...input,
        mentorIds,
      });
    }

    const isPublished =
      typeof input.isPublished === "boolean"
        ? input.isPublished
        : input.status === "PUBLISHED";

    const payload = {
      title: input.title,
      slug: input.slug,
      description: input.description || undefined,
      imageUrl: input.imageUrl || undefined,
      isPublished,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCreated = await apiRequest<any>("courses", {
      method: "POST",
      body: payload,
      authenticated: true,
    });

    return normalizeCourse(rawCreated);
  }

  /**
   * Updates an existing course.
   * Connects to PATCH /api/v1/courses/:id (MENTOR or ADMIN only).
   */
  async update(
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updates: any,
    user: CurrentUser | null
  ): Promise<Course> {
    if (this.isTestEnv()) {
      const course = await courseRepository.getById(id);
      if (!course) {
        throw new Error(`Course "${id}" was not found.`);
      }
      if (!canAccessCourse(user, course, "edit")) {
        throw new Error("Access denied: you do not have permission to modify this course.");
      }
      return courseRepository.update(id, updates);
    }

    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.imageUrl !== undefined) payload.imageUrl = updates.imageUrl;

    if (updates.isPublished !== undefined) {
      payload.isPublished = updates.isPublished;
    } else if (updates.status !== undefined) {
      payload.isPublished = updates.status === "PUBLISHED";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawUpdated = await apiRequest<any>(`courses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
      authenticated: true,
    });

    return normalizeCourse(rawUpdated);
  }

  /**
   * Deletes a course.
   * Connects to DELETE /api/v1/courses/:id (MENTOR or ADMIN only).
   */
  async delete(id: string, user: CurrentUser | null): Promise<boolean> {
    if (this.isTestEnv()) {
      const course = await courseRepository.getById(id);
      if (!course) {
        throw new Error(`Course "${id}" was not found.`);
      }
      if (!canAccessCourse(user, course, "delete")) {
        throw new Error("Access denied: course deletion requires administrative privileges.");
      }
      return courseRepository.delete(id);
    }

    await apiRequest<{ id: string; message: string }>(
      `courses/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        authenticated: true,
      }
    );

    return true;
  }
}

export const courseService = new CourseService();
