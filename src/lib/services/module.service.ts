import { apiRequest } from "@/lib/api/client";
import { moduleRepository, courseRepository } from "@/lib/repositories";
import type {
  CourseModule,
  ContentItem,
  ModuleDetailWithContent,
  ModuleWithCount,
  AttachOrAddModuleInput,
  CreateModuleInput,
  UpdateModuleInput,
} from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { CurrentUser } from "@/types/auth";
import { canAccessCourse, hasPermission } from "@/lib/access/access-control";
import { PERMISSIONS } from "@/lib/access/permissions";
import { normalizeContentItem } from "./content.service";

/**
 * Normalizes raw backend module payloads into consistent frontend domain models.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeModule(raw: any): ModuleDetailWithContent {
  if (!raw) {
    throw new Error("Cannot normalize null or undefined module data");
  }

  const contentItems = Array.isArray(raw.contentItems)
    ? raw.contentItems.map(normalizeContentItem)
    : [];

  const contentIds =
    Array.isArray(raw.contentIds) && raw.contentIds.length > 0
      ? raw.contentIds
      : contentItems.map((c: ContentItem) => c.id);

  return {
    id: raw.id,
    courseId: raw.courseId,
    title: raw.title || "",
    description: raw.description ?? null,
    isPublished: Boolean(raw.isPublished),
    order: typeof raw.order === "number" ? raw.order : 1,
    courseModuleId: raw.courseModuleId,
    createdById: raw.createdById ?? null,
    contentIds,
    contentItems,
    courseModules: raw.courseModules ?? [],
    _count: raw._count ?? {
      contentItems: contentItems.length,
      courseModules: Array.isArray(raw.courseModules) ? raw.courseModules.length : 0,
    },
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export class ModuleService {
  private isTestEnv(): boolean {
    return (
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "test" ||
        Boolean(process.env.NODE_TEST_CONTEXT) ||
        !process.env.NEXT_PUBLIC_API_BASE_URL)
    );
  }

  // ==========================================
  // Course–Module Associations & Ordering
  // ==========================================

  /**
   * Lists modules attached to a specific course in persisted order.
   * Connects to GET /api/v1/courses/:courseId/modules
   */
  async listByCourse(
    courseId: string,
    user?: CurrentUser | null
  ): Promise<ModuleDetailWithContent[]> {
    if (this.isTestEnv()) {
      const course = await courseRepository.getById(courseId);
      if (!course || !canAccessCourse(user ?? null, course, "view")) {
        throw new Error("Access denied or course not found.");
      }
      const rawList = await moduleRepository.list(courseId);
      return rawList.map(normalizeModule);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawModules = await apiRequest<any[]>(
      `courses/${encodeURIComponent(courseId)}/modules`,
      {
        method: "GET",
        authenticated: Boolean(user),
      }
    );

    return (rawModules || []).map(normalizeModule);
  }

  /**
   * Attaches an existing module or creates and attaches a new module to a course.
   * Connects to POST /api/v1/courses/:courseId/modules (MENTOR or ADMIN only).
   */
  async attachOrAdd(
    courseId: string,
    input: AttachOrAddModuleInput,
    user: CurrentUser | null
  ): Promise<ModuleDetailWithContent> {
    if (this.isTestEnv()) {
      const course = await courseRepository.getById(courseId);
      if (!course || !canAccessCourse(user, course, "edit")) {
        throw new Error("Access denied: you do not have permission to add modules to this course.");
      }

      const created = await moduleRepository.create({
        courseId,
        title: input.title || "Untitled Module",
        description: input.description || undefined,
        order: input.order ?? 1,
        contentIds: [],
      });
      return normalizeModule(created);
    }

    const payload: Record<string, unknown> = {};
    if (input.moduleId) {
      payload.moduleId = input.moduleId;
    } else {
      payload.title = input.title?.trim();
      if (input.description !== undefined) payload.description = input.description?.trim() || null;
      if (input.isPublished !== undefined) payload.isPublished = input.isPublished;
    }
    if (input.order !== undefined) {
      payload.order = input.order;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawResult = await apiRequest<any>(
      `courses/${encodeURIComponent(courseId)}/modules`,
      {
        method: "POST",
        body: payload,
        authenticated: true,
      }
    );

    return normalizeModule(rawResult);
  }

  /**
   * Detaches a module from a course without deleting the module.
   * Connects to DELETE /api/v1/courses/:courseId/modules/:moduleId (MENTOR or ADMIN only).
   */
  async detach(
    courseId: string,
    moduleId: string,
    user: CurrentUser | null
  ): Promise<{ message: string; courseId: string; moduleId: string }> {
    if (this.isTestEnv()) {
      const course = await courseRepository.getById(courseId);
      if (!course || !canAccessCourse(user, course, "edit")) {
        throw new Error("Access denied: you do not have permission to modify this course.");
      }
      return {
        message: "Module detached successfully",
        courseId,
        moduleId,
      };
    }

    return apiRequest<{ message: string; courseId: string; moduleId: string }>(
      `courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
      {
        method: "DELETE",
        authenticated: true,
      }
    );
  }

  /**
   * Reorders modules in a course.
   * Connects to PATCH /api/v1/courses/:courseId/modules/reorder (MENTOR or ADMIN only).
   */
  async reorder(
    courseId: string,
    moduleIds: string[],
    user: CurrentUser | null
  ): Promise<ModuleDetailWithContent[]> {
    if (this.isTestEnv()) {
      const course = await courseRepository.getById(courseId);
      if (!course || !canAccessCourse(user, course, "edit")) {
        throw new Error("Access denied: you do not have permission to modify this course.");
      }
      const rawList = await moduleRepository.list(courseId);
      return rawList.map(normalizeModule);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawResult = await apiRequest<any[]>(
      `courses/${encodeURIComponent(courseId)}/modules/reorder`,
      {
        method: "PATCH",
        body: { moduleIds },
        authenticated: true,
      }
    );

    return (rawResult || []).map(normalizeModule);
  }

  // ==========================================
  // Independent Modules Library & CRUD
  // ==========================================

  /**
   * Lists independent modules with pagination and filter support.
   * Connects to GET /api/v1/modules?page=&limit=&isPublished=
   */
  async listLibrary(
    params?: PaginationParams & { isPublished?: boolean },
    user?: CurrentUser | null
  ): Promise<PaginatedResult<ModuleWithCount>> {
    if (this.isTestEnv()) {
      const allModules = await moduleRepository.list();
      const mapped: ModuleWithCount[] = allModules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description ?? null,
        isPublished: true,
        createdById: null,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        _count: {
          contentItems: m.contentIds?.length || 0,
          courseModules: 1,
        },
      }));

      return {
        items: mapped,
        total: mapped.length,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.isPublished !== undefined) {
      searchParams.set("isPublished", String(params.isPublished));
    }

    const queryStr = searchParams.toString();
    const path = queryStr ? `modules?${queryStr}` : "modules";

    return apiRequest<PaginatedResult<ModuleWithCount>>(path, {
      method: "GET",
      authenticated: Boolean(user),
    });
  }

  /**
   * Retrieves module details by UUID.
   * Connects to GET /api/v1/modules/:moduleId
   */
  async getById(id: string, user?: CurrentUser | null): Promise<ModuleDetailWithContent> {
    if (this.isTestEnv()) {
      const mod = await moduleRepository.getById(id);
      if (!mod) {
        throw new Error(`Module "${id}" not found.`);
      }
      return normalizeModule(mod);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawModule = await apiRequest<any>(`modules/${encodeURIComponent(id)}`, {
      method: "GET",
      authenticated: Boolean(user),
    });

    return normalizeModule(rawModule);
  }

  /**
   * Creates an independent module.
   * Connects to POST /api/v1/modules (MENTOR or ADMIN only).
   */
  async create(
    input: CreateModuleInput,
    user: CurrentUser | null
  ): Promise<CourseModule> {
    if (this.isTestEnv()) {
      if (!hasPermission(user, PERMISSIONS.MODULE_CREATE)) {
        throw new Error("Access denied: you do not have permission to create modules.");
      }
      return moduleRepository.create({
        courseId: "mock-course",
        title: input.title,
        description: input.description || undefined,
        order: 1,
        contentIds: [],
      });
    }

    const payload = {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      isPublished: input.isPublished ?? false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCreated = await apiRequest<any>("modules", {
      method: "POST",
      body: payload,
      authenticated: true,
    });

    return normalizeModule(rawCreated);
  }

  /**
   * Updates an existing module.
   * Connects to PATCH /api/v1/modules/:moduleId (MENTOR or ADMIN only).
   */
  async update(
    id: string,
    updates: UpdateModuleInput,
    user?: CurrentUser | null
  ): Promise<CourseModule> {
    void user;
    if (this.isTestEnv()) {
      const mod = await moduleRepository.getById(id);
      if (!mod) throw new Error(`Module "${id}" not found.`);
      return moduleRepository.update(id, updates as Partial<Omit<CourseModule, "id" | "createdAt">>);
    }

    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.isPublished !== undefined) payload.isPublished = updates.isPublished;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawUpdated = await apiRequest<any>(`modules/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
      authenticated: true,
    });

    return normalizeModule(rawUpdated);
  }

  /**
   * Deletes an independent module.
   * Connects to DELETE /api/v1/modules/:moduleId (MENTOR or ADMIN only).
   * Notice: Backend returns 409 CONFLICT if module is attached to any course.
   */
  async delete(id: string, user?: CurrentUser | null): Promise<boolean> {
    void user;
    if (this.isTestEnv()) {
      const mod = await moduleRepository.getById(id);
      if (!mod) throw new Error(`Module "${id}" not found.`);
      return moduleRepository.delete(id);
    }

    await apiRequest<{ id: string; message: string }>(
      `modules/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        authenticated: true,
      }
    );

    return true;
  }

  /**
   * Backward-compatible list method used by legacy code.
   */
  async list(courseId?: string, user?: CurrentUser | null): Promise<CourseModule[]> {
    if (courseId) {
      return this.listByCourse(courseId, user);
    }
    const library = await this.listLibrary(undefined, user);
    return library.items.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      isPublished: m.isPublished,
      order: 1,
      contentIds: [],
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      _count: m._count,
    }));
  }
}

export const moduleService = new ModuleService();
