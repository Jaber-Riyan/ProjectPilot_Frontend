import { apiRequest } from "@/lib/api/client";
import {
  contentRepository,
  moduleRepository,
  courseRepository,
} from "@/lib/repositories";
import type {
  ContentItem,
  CreateContentItemInput,
  UpdateContentItemInput,
} from "@/types/domain";
import type { CurrentUser } from "@/types/auth";
import { canAccessCourse } from "@/lib/access/access-control";

/**
 * Normalizes raw backend content item entities into consistent frontend domain models.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeContentItem(raw: any): ContentItem {
  if (!raw) {
    throw new Error("Cannot normalize null or undefined content item");
  }

  return {
    id: raw.id,
    moduleId: raw.moduleId,
    title: raw.title || "",
    type: raw.type,
    order: typeof raw.order === "number" ? raw.order : 1,
    description: raw.description ?? null,
    body: raw.body ?? null,
    url: raw.url ?? null,
    assignmentId: raw.assignmentId ?? null,
    assignment: raw.assignment ?? null,
    module: raw.module ?? null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export class ContentService {
  private isTestEnv(): boolean {
    return (
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "test" ||
        Boolean(process.env.NODE_TEST_CONTEXT) ||
        !process.env.NEXT_PUBLIC_API_BASE_URL)
    );
  }

  /**
   * Lists content items belonging to a module in persisted order.
   * Connects to GET /api/v1/modules/:moduleId/content
   */
  async listByModule(
    moduleId: string,
    user?: CurrentUser | null
  ): Promise<ContentItem[]> {
    if (this.isTestEnv()) {
      const rawItems = await contentRepository.list(moduleId);
      return rawItems.map(normalizeContentItem);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawItems = await apiRequest<any[]>(
      `modules/${encodeURIComponent(moduleId)}/content`,
      {
        method: "GET",
        authenticated: Boolean(user),
      }
    );

    return (rawItems || []).map(normalizeContentItem);
  }

  /**
   * Retrieves content item details by ID.
   * Connects to GET /api/v1/content/:contentId
   */
  async getById(id: string, user?: CurrentUser | null): Promise<ContentItem> {
    if (this.isTestEnv()) {
      const item = await contentRepository.getById(id);
      if (!item) throw new Error(`Content item "${id}" not found.`);
      return normalizeContentItem(item);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawItem = await apiRequest<any>(
      `content/${encodeURIComponent(id)}`,
      {
        method: "GET",
        authenticated: Boolean(user),
      }
    );

    return normalizeContentItem(rawItem);
  }

  /**
   * Creates a new content item within a module.
   * Connects to POST /api/v1/modules/:moduleId/content (MENTOR or ADMIN only).
   */
  async create(
    moduleId: string,
    input: CreateContentItemInput,
    user: CurrentUser | null
  ): Promise<ContentItem> {
    if (this.isTestEnv()) {
      const mod = await moduleRepository.getById(moduleId);
      if (!mod) throw new Error("Module not found.");

      if (mod.courseId) {
        const course = await courseRepository.getById(mod.courseId);
        if (!course || !canAccessCourse(user, course, "edit")) {
          throw new Error("Access denied: you do not have permission to add content to this course.");
        }
      }

      const created = await contentRepository.create({
        moduleId,
        title: input.title,
        type: input.type,
        order: input.order ?? 1,
        body: input.body ?? undefined,
        url: input.url ?? undefined,
        assignmentId: input.assignmentId ?? undefined,
      });
      return normalizeContentItem(created);
    }

    const payload: Record<string, unknown> = {
      title: input.title.trim(),
      type: input.type,
      description: input.description?.trim() || null,
      body: input.body?.trim() || null,
      url: input.url?.trim() || null,
      assignmentId: input.assignmentId?.trim() || null,
    };
    if (input.order !== undefined) payload.order = input.order;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawResult = await apiRequest<any>(
      `modules/${encodeURIComponent(moduleId)}/content`,
      {
        method: "POST",
        body: payload,
        authenticated: true,
      }
    );

    return normalizeContentItem(rawResult);
  }

  /**
   * Updates an existing content item.
   * Connects to PATCH /api/v1/content/:contentId (MENTOR or ADMIN only).
   */
  async update(
    id: string,
    updates: UpdateContentItemInput,
    user?: CurrentUser | null
  ): Promise<ContentItem> {
    void user;
    if (this.isTestEnv()) {
      const item = await contentRepository.getById(id);
      if (!item) throw new Error(`Content item "${id}" not found.`);
      const updated = await contentRepository.update(id, updates as Partial<Omit<ContentItem, "id" | "createdAt">>);
      return normalizeContentItem(updated);
    }

    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.body !== undefined) payload.body = updates.body?.trim() || null;
    if (updates.url !== undefined) payload.url = updates.url?.trim() || null;
    if (updates.assignmentId !== undefined) payload.assignmentId = updates.assignmentId?.trim() || null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawUpdated = await apiRequest<any>(
      `content/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: payload,
        authenticated: true,
      }
    );

    return normalizeContentItem(rawUpdated);
  }

  /**
   * Deletes a content item.
   * Connects to DELETE /api/v1/content/:contentId (MENTOR or ADMIN only).
   */
  async delete(id: string, user?: CurrentUser | null): Promise<boolean> {
    void user;
    if (this.isTestEnv()) {
      const item = await contentRepository.getById(id);
      if (!item) throw new Error(`Content item "${id}" not found.`);
      return contentRepository.delete(id);
    }

    await apiRequest<{ id: string; message: string }>(
      `content/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        authenticated: true,
      }
    );

    return true;
  }

  /**
   * Reorders content items within a module.
   * Connects to PATCH /api/v1/modules/:moduleId/content/reorder (MENTOR or ADMIN only).
   */
  async reorder(
    moduleId: string,
    contentItemIds: string[],
    user?: CurrentUser | null
  ): Promise<ContentItem[]> {
    void user;
    if (this.isTestEnv()) {
      const rawList = await contentRepository.list(moduleId);
      return rawList.map(normalizeContentItem);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawResult = await apiRequest<any[]>(
      `modules/${encodeURIComponent(moduleId)}/content/reorder`,
      {
        method: "PATCH",
        body: { contentItemIds },
        authenticated: true,
      }
    );

    return (rawResult || []).map(normalizeContentItem);
  }

  /**
   * Backward-compatible list method used by legacy code.
   */
  async list(moduleId?: string, user?: CurrentUser | null): Promise<ContentItem[]> {
    if (moduleId) {
      return this.listByModule(moduleId, user);
    }
    return contentRepository.list();
  }
}

export const contentService = new ContentService();
