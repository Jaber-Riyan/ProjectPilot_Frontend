import { moduleRepository, courseRepository } from "@/lib/repositories";
import type { CourseModule } from "@/types/domain";
import type { CurrentUser } from "@/types/auth";
import { canAccessCourse } from "@/lib/access/access-control";

export class ModuleService {
  async list(courseId?: string, user?: CurrentUser | null): Promise<CourseModule[]> {
    if (courseId) {
      const course = await courseRepository.getById(courseId);
      if (!course || !canAccessCourse(user ?? null, course, "view")) {
        throw new Error("Access denied or course not found.");
      }
    }
    return moduleRepository.list(courseId);
  }

  async getById(id: string, user?: CurrentUser | null): Promise<CourseModule> {
    const mod = await moduleRepository.getById(id);
    if (!mod) {
      throw new Error(`Module "${id}" not found.`);
    }

    const course = await courseRepository.getById(mod.courseId);
    if (!course || !canAccessCourse(user ?? null, course, "view")) {
      throw new Error("Access denied or course not found.");
    }

    return mod;
  }

  async create(
    input: Omit<CourseModule, "id" | "createdAt" | "updatedAt">,
    user: CurrentUser | null
  ): Promise<CourseModule> {
    const course = await courseRepository.getById(input.courseId);
    if (!course || !canAccessCourse(user, course, "edit")) {
      throw new Error("Access denied: you do not have permission to add modules to this course.");
    }

    return moduleRepository.create(input);
  }

  async update(
    id: string,
    updates: Partial<Omit<CourseModule, "id" | "createdAt">>,
    user: CurrentUser | null
  ): Promise<CourseModule> {
    const mod = await moduleRepository.getById(id);
    if (!mod) throw new Error(`Module "${id}" not found.`);

    const course = await courseRepository.getById(mod.courseId);
    if (!course || !canAccessCourse(user, course, "edit")) {
      throw new Error("Access denied: you do not have permission to modify this module.");
    }

    return moduleRepository.update(id, updates);
  }

  async delete(id: string, user: CurrentUser | null): Promise<boolean> {
    const mod = await moduleRepository.getById(id);
    if (!mod) throw new Error(`Module "${id}" not found.`);

    const course = await courseRepository.getById(mod.courseId);
    if (!course || !canAccessCourse(user, course, "edit")) {
      throw new Error("Access denied: you do not have permission to delete this module.");
    }

    return moduleRepository.delete(id);
  }
}

export const moduleService = new ModuleService();
