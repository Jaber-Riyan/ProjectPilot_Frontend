import { courseRepository } from "@/lib/repositories";
import type { Course } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { CurrentUser } from "@/types/auth";
import { canAccessCourse, hasPermission } from "@/lib/access/access-control";
import { PERMISSIONS } from "@/lib/access/permissions";
import { paginateArray } from "@/lib/repositories/mock/pagination-helper";

export class CourseService {
  async list(params?: PaginationParams, user?: CurrentUser | null): Promise<PaginatedResult<Course>> {
    // Fetch all matching courses from repository
    const result = await courseRepository.list({ ...params, limit: 1000, page: 1 });
    let items = result.items;

    // Apply role scoping
    if (!user || user.role === "STUDENT") {
      // Students and guests only see published courses
      items = items.filter((c) => c.status === "PUBLISHED");
    } else if (user.role === "MENTOR") {
      // Mentors see published courses and draft/archived courses assigned to them
      items = items.filter((c) => c.status === "PUBLISHED" || c.mentorIds.includes(user.id));
    }
    // Admin sees all

    return paginateArray(items, params?.page, params?.limit);
  }

  async getById(id: string, user?: CurrentUser | null): Promise<Course> {
    const course = await courseRepository.getById(id);
    if (!course) {
      throw new Error(`Course "${id}" was not found.`);
    }

    if (!canAccessCourse(user ?? null, course, "view")) {
      throw new Error("Access denied: you do not have permission to view this course.");
    }

    return course;
  }

  async create(
    input: Omit<Course, "id" | "createdAt" | "updatedAt">,
    user: CurrentUser | null
  ): Promise<Course> {
    if (!hasPermission(user, PERMISSIONS.COURSE_CREATE)) {
      throw new Error("Access denied: you do not have permission to create courses.");
    }

    // Ensure mentor is included in mentorIds if created by a mentor
    const mentorIds = [...input.mentorIds];
    if (user && user.role === "MENTOR" && !mentorIds.includes(user.id)) {
      mentorIds.push(user.id);
    }

    return courseRepository.create({
      ...input,
      mentorIds,
    });
  }

  async update(
    id: string,
    updates: Partial<Omit<Course, "id" | "createdAt">>,
    user: CurrentUser | null
  ): Promise<Course> {
    const course = await courseRepository.getById(id);
    if (!course) {
      throw new Error(`Course "${id}" was not found.`);
    }

    if (!canAccessCourse(user, course, "edit")) {
      throw new Error("Access denied: you do not have permission to modify this course.");
    }

    return courseRepository.update(id, updates);
  }

  async delete(id: string, user: CurrentUser | null): Promise<boolean> {
    const course = await courseRepository.getById(id);
    if (!course) {
      throw new Error(`Course "${id}" was not found.`);
    }

    if (!canAccessCourse(user, course, "delete")) {
      throw new Error("Access denied: course deletion requires administrative privileges.");
    }

    return courseRepository.delete(id);
  }
}

export const courseService = new CourseService();
