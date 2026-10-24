import { assignmentRepository, courseRepository } from "@/lib/repositories";
import type { Assignment } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { CurrentUser } from "@/types/auth";
import { canAccessCourse, hasPermission } from "@/lib/access/access-control";
import { PERMISSIONS } from "@/lib/access/permissions";
import { paginateArray } from "@/lib/repositories/mock/pagination-helper";

export class AssignmentService {
  async list(
    params?: PaginationParams & { courseId?: string },
    user?: CurrentUser | null
  ): Promise<PaginatedResult<Assignment>> {
    const result = await assignmentRepository.list({ ...params, limit: 1000, page: 1 });
    let items = result.items;

    if (!user || user.role === "STUDENT") {
      items = items.filter((a) => a.status === "PUBLISHED");
    } else if (user.role === "MENTOR") {
      // Find courses assigned to this mentor
      const allCourses = await courseRepository.list({ limit: 1000, page: 1 });
      const assignedCourseIds = allCourses.items
        .filter((c) => c.mentorIds.includes(user.id))
        .map((c) => c.id);

      items = items.filter(
        (a) =>
          a.status === "PUBLISHED" ||
          a.createdById === user.id ||
          (a.courseId && assignedCourseIds.includes(a.courseId))
      );
    }
    // Admin gets all

    return paginateArray(items, params?.page, params?.limit);
  }

  async getById(id: string, user?: CurrentUser | null): Promise<Assignment> {
    const assignment = await assignmentRepository.getById(id);
    if (!assignment) {
      throw new Error(`Assignment "${id}" not found.`);
    }

    if (!user || user.role === "STUDENT") {
      if (assignment.status !== "PUBLISHED") {
        throw new Error("Access denied: this assignment is not currently published.");
      }
    }

    return assignment;
  }

  async create(
    input: Omit<Assignment, "id" | "createdAt" | "updatedAt">,
    user: CurrentUser | null
  ): Promise<Assignment> {
    if (!hasPermission(user, PERMISSIONS.ASSIGNMENT_CREATE)) {
      throw new Error("Access denied: you do not have permission to create assignments.");
    }

    if (input.courseId && user?.role === "MENTOR") {
      const course = await courseRepository.getById(input.courseId);
      if (!course || !canAccessCourse(user, course, "edit")) {
        throw new Error("Access denied: you cannot add assignments to a course you are not assigned to.");
      }
    }

    return assignmentRepository.create({
      ...input,
      createdById: user?.id ?? input.createdById,
    });
  }

  async update(
    id: string,
    updates: Partial<Omit<Assignment, "id" | "createdAt">>,
    user: CurrentUser | null
  ): Promise<Assignment> {
    const asg = await assignmentRepository.getById(id);
    if (!asg) throw new Error(`Assignment "${id}" not found.`);

    if (!hasPermission(user, PERMISSIONS.ASSIGNMENT_UPDATE)) {
      throw new Error("Access denied: you do not have permission to update assignments.");
    }

    if (user?.role === "MENTOR") {
      let isAllowed = asg.createdById === user.id;
      if (!isAllowed && asg.courseId) {
        const course = await courseRepository.getById(asg.courseId);
        if (course && course.mentorIds.includes(user.id)) {
          isAllowed = true;
        }
      }
      if (!isAllowed) {
        throw new Error("Access denied: you cannot modify an assignment for a course you are not assigned to.");
      }
    }

    return assignmentRepository.update(id, updates);
  }

  async delete(id: string, user: CurrentUser | null): Promise<boolean> {
    const asg = await assignmentRepository.getById(id);
    if (!asg) throw new Error(`Assignment "${id}" not found.`);

    if (!hasPermission(user, PERMISSIONS.ASSIGNMENT_DELETE)) {
      throw new Error("Access denied: assignment deletion requires administrative privileges.");
    }

    return assignmentRepository.delete(id);
  }
}

export const assignmentService = new AssignmentService();
