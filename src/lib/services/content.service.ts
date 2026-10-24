import {
  contentRepository,
  moduleRepository,
  courseRepository,
} from "@/lib/repositories";
import type { ContentItem } from "@/types/domain";
import type { CurrentUser } from "@/types/auth";
import { canAccessCourse } from "@/lib/access/access-control";

export class ContentService {
  async list(moduleId?: string, user?: CurrentUser | null): Promise<ContentItem[]> {
    if (moduleId) {
      const mod = await moduleRepository.getById(moduleId);
      if (mod) {
        const course = await courseRepository.getById(mod.courseId);
        if (course && !canAccessCourse(user ?? null, course, "view")) {
          throw new Error("Access denied: you cannot view content for this course.");
        }
      }
    }
    return contentRepository.list(moduleId);
  }

  async getById(id: string, user?: CurrentUser | null): Promise<ContentItem> {
    const item = await contentRepository.getById(id);
    if (!item) throw new Error(`Content item "${id}" not found.`);

    const mod = await moduleRepository.getById(item.moduleId);
    if (mod) {
      const course = await courseRepository.getById(mod.courseId);
      if (course && !canAccessCourse(user ?? null, course, "view")) {
        throw new Error("Access denied: you cannot view this content.");
      }
    }

    return item;
  }

  async create(
    input: Omit<ContentItem, "id" | "createdAt" | "updatedAt">,
    user: CurrentUser | null
  ): Promise<ContentItem> {
    const mod = await moduleRepository.getById(input.moduleId);
    if (!mod) throw new Error("Module not found.");

    const course = await courseRepository.getById(mod.courseId);
    if (!course || !canAccessCourse(user, course, "edit")) {
      throw new Error("Access denied: you do not have permission to add content to this course.");
    }

    return contentRepository.create(input);
  }

  async update(
    id: string,
    updates: Partial<Omit<ContentItem, "id" | "createdAt">>,
    user: CurrentUser | null
  ): Promise<ContentItem> {
    const item = await contentRepository.getById(id);
    if (!item) throw new Error(`Content item "${id}" not found.`);

    const mod = await moduleRepository.getById(item.moduleId);
    if (!mod) throw new Error("Module not found.");

    const course = await courseRepository.getById(mod.courseId);
    if (!course || !canAccessCourse(user, course, "edit")) {
      throw new Error("Access denied: you do not have permission to edit this content.");
    }

    return contentRepository.update(id, updates);
  }

  async delete(id: string, user: CurrentUser | null): Promise<boolean> {
    const item = await contentRepository.getById(id);
    if (!item) throw new Error(`Content item "${id}" not found.`);

    const mod = await moduleRepository.getById(item.moduleId);
    if (!mod) throw new Error("Module not found.");

    const course = await courseRepository.getById(mod.courseId);
    if (!course || !canAccessCourse(user, course, "edit")) {
      throw new Error("Access denied: you do not have permission to delete this content.");
    }

    return contentRepository.delete(id);
  }
}

export const contentService = new ContentService();
