import { apiRequest } from "@/lib/api/client";
import { assignmentRepository, courseRepository } from "@/lib/repositories";
import type { Assignment, AssignmentStatus } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { CurrentUser } from "@/types/auth";
import { canAccessCourse, hasPermission } from "@/lib/access/access-control";
import { PERMISSIONS } from "@/lib/access/permissions";
import { paginateArray } from "@/lib/repositories/mock/pagination-helper";

/**
 * Normalizes raw backend assignment responses into typed frontend domain models.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeAssignment(raw: any): Assignment {
  if (!raw) {
    throw new Error("Cannot normalize null or undefined assignment data");
  }

  const isPublished =
    typeof raw.isPublished === "boolean"
      ? raw.isPublished
      : raw.status === "PUBLISHED";

  const status: AssignmentStatus =
    raw.status && ["DRAFT", "PUBLISHED", "CLOSED"].includes(raw.status)
      ? raw.status
      : isPublished
      ? "PUBLISHED"
      : "DRAFT";

  const instructions = raw.instructions || raw.description || "";
  const description =
    raw.description ||
    (instructions.length > 140 ? `${instructions.slice(0, 140)}...` : instructions);

  const dueAt = raw.dueAt ?? raw.dueDate ?? null;
  const dueDate = raw.dueDate ?? raw.dueAt ?? null;

  return {
    id: raw.id,
    courseId: raw.courseId,
    title: raw.title || "",
    description,
    instructions,
    status,
    isPublished,
    submissionPolicy: raw.submissionPolicy || "ONE_TIME",
    dueAt,
    dueDate,
    maxScore: typeof raw.maxScore === "number" ? raw.maxScore : 100,
    createdById: raw.createdById ?? null,
    createdBy: raw.createdBy ?? null,
    contentItems: raw.contentItems ?? [],
    _count: raw._count ?? { submissions: 0, contentItems: 0 },
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export class AssignmentService {
  private isTestEnv(): boolean {
    return (
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "test" ||
        Boolean(process.env.NODE_TEST_CONTEXT) ||
        !process.env.NEXT_PUBLIC_API_BASE_URL)
    );
  }

  /**
   * Lists assignments with role-based scoping and pagination.
   * Connects to GET /api/v1/assignments
   */
  async list(
    params?: PaginationParams & { courseId?: string; status?: string; isPublished?: boolean },
    user?: CurrentUser | null
  ): Promise<PaginatedResult<Assignment>> {
    if (this.isTestEnv()) {
      const result = await assignmentRepository.list({ ...params, limit: 1000, page: 1 });
      let items = result.items;

      if (!user || user.role === "STUDENT") {
        items = items.filter((a) => a.status === "PUBLISHED");
      } else if (user.role === "MENTOR") {
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

      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (a) => a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q))
        );
      }

      if (params?.status && params.status !== "ALL") {
        items = items.filter((a) => a.status === params.status);
      }

      return paginateArray(items, params?.page, params?.limit);
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    if (params?.status && params.status !== "ALL") {
      if (params.status === "PUBLISHED" || params.status === "DRAFT") {
        searchParams.set("status", params.status);
      }
    }

    if (typeof params?.isPublished === "boolean") {
      searchParams.set("isPublished", params.isPublished ? "true" : "false");
    }

    const queryStr = searchParams.toString();
    const path = queryStr ? `assignments?${queryStr}` : "assignments";

    const response = await apiRequest<{
      items: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }>(path, {
      method: "GET",
      authenticated: Boolean(user),
    });

    let items = (response.items || []).map(normalizeAssignment);

    // Filter in-memory if search or courseId is specified on frontend
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (a) => a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q))
      );
    }

    return {
      ...response,
      items,
    };
  }

  /**
   * Retrieves single assignment details.
   * Connects to GET /api/v1/assignments/:id
   */
  async getById(id: string, user?: CurrentUser | null): Promise<Assignment> {
    if (this.isTestEnv()) {
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

    const raw = await apiRequest<unknown>(`/assignments/${id}`, {
      method: "GET",
    });

    return normalizeAssignment(raw);
  }

  /**
   * Creates an assignment.
   * Restricted to MENTOR and ADMIN.
   * Connects to POST /api/v1/assignments
   */
  async create(
    input: Partial<Assignment> & { title: string; instructions: string },
    user: CurrentUser | null
  ): Promise<Assignment> {
    if (this.isTestEnv()) {
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
        title: input.title,
        description: input.description || input.instructions.slice(0, 140),
        instructions: input.instructions,
        status: input.status || "DRAFT",
        submissionPolicy: input.submissionPolicy || "RESUBMITTABLE",
        dueDate: input.dueDate || (input.dueAt ? String(input.dueAt) : undefined),
        maxScore: input.maxScore ?? 100,
        createdById: user?.id ?? "unknown",
      });
    }

    if (!user || (user.role !== "MENTOR" && user.role !== "ADMIN")) {
      throw new Error("Access denied: only mentors and administrators can create assignments.");
    }

    const payload = {
      title: input.title.trim(),
      instructions: (input.instructions || input.description || "").trim(),
      submissionPolicy: input.submissionPolicy || "ONE_TIME",
      isPublished: input.isPublished ?? (input.status === "PUBLISHED"),
      dueAt: input.dueAt || input.dueDate ? new Date(input.dueAt || input.dueDate!).toISOString() : null,
    };

    const raw = await apiRequest<unknown>("/assignments", {
      method: "POST",
      body: payload,
    });

    return normalizeAssignment(raw);
  }

  /**
   * Updates an existing assignment.
   * Restricted to creator MENTOR and ADMIN.
   * Connects to PATCH /api/v1/assignments/:id
   */
  async update(
    id: string,
    updates: Partial<Assignment>,
    user: CurrentUser | null
  ): Promise<Assignment> {
    if (this.isTestEnv()) {
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

    if (!user || (user.role !== "MENTOR" && user.role !== "ADMIN")) {
      throw new Error("Access denied: only mentors and administrators can update assignments.");
    }

    const payload: Record<string, unknown> = {};

    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.instructions !== undefined) payload.instructions = updates.instructions.trim();
    if (updates.submissionPolicy !== undefined) payload.submissionPolicy = updates.submissionPolicy;
    if (updates.isPublished !== undefined) {
      payload.isPublished = updates.isPublished;
    } else if (updates.status !== undefined) {
      payload.isPublished = updates.status === "PUBLISHED";
    }
    if (updates.dueAt !== undefined || updates.dueDate !== undefined) {
      const dateVal = updates.dueAt ?? updates.dueDate;
      payload.dueAt = dateVal ? new Date(dateVal).toISOString() : null;
    }

    const raw = await apiRequest<unknown>(`/assignments/${id}`, {
      method: "PATCH",
      body: payload,
    });

    return normalizeAssignment(raw);
  }

  /**
   * Deletes an assignment.
   * Restricted to creator MENTOR and ADMIN.
   * Connects to DELETE /api/v1/assignments/:id
   */
  async delete(id: string, user: CurrentUser | null): Promise<boolean> {
    if (this.isTestEnv()) {
      const asg = await assignmentRepository.getById(id);
      if (!asg) throw new Error(`Assignment "${id}" not found.`);

      if (!hasPermission(user, PERMISSIONS.ASSIGNMENT_DELETE)) {
        throw new Error("Access denied: assignment deletion requires administrative privileges.");
      }

      return assignmentRepository.delete(id);
    }

    if (!user || (user.role !== "MENTOR" && user.role !== "ADMIN")) {
      throw new Error("Access denied: only mentors and administrators can delete assignments.");
    }

    await apiRequest<{ id: string; message: string }>(`/assignments/${id}`, {
      method: "DELETE",
    });

    return true;
  }
}

export const assignmentService = new AssignmentService();
