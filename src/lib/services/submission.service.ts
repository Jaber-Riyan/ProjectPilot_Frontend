import { apiRequest } from "@/lib/api/client";
import {
  submissionRepository,
  assignmentRepository,
  courseRepository,
} from "@/lib/repositories";
import type { Submission } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { CurrentUser } from "@/types/auth";
import { canAccessSubmission, hasPermission } from "@/lib/access/access-control";
import { PERMISSIONS } from "@/lib/access/permissions";
import { paginateArray } from "@/lib/repositories/mock/pagination-helper";

/**
 * Normalizes raw backend submission payloads into typed domain objects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSubmission(raw: any): Submission {
  if (!raw) {
    throw new Error("Cannot normalize null or undefined submission");
  }

  const projectName =
    raw.projectName ||
    (raw.assignment?.title ? `Submission: ${raw.assignment.title}` : `Attempt #${raw.attemptNumber ?? 1}`);

  const repoUrl =
    raw.repoUrl ||
    (Array.isArray(raw.attachmentUrls) && raw.attachmentUrls[0]) ||
    "";

  const liveUrl =
    raw.liveUrl ??
    (Array.isArray(raw.attachmentUrls) && raw.attachmentUrls[1] ? raw.attachmentUrls[1] : null);

  const description = raw.description ?? raw.answerText ?? null;

  const attachmentUrls =
    Array.isArray(raw.attachmentUrls) && raw.attachmentUrls.length > 0
      ? raw.attachmentUrls
      : ([repoUrl, liveUrl].filter(Boolean) as string[]);

  const submittedAt = raw.submittedAt || raw.createdAt || new Date().toISOString();

  return {
    id: raw.id,
    assignmentId: raw.assignmentId,
    studentId: raw.studentId,
    attemptNumber: typeof raw.attemptNumber === "number" ? raw.attemptNumber : 1,
    projectName,
    repoUrl,
    liveUrl,
    description,
    answerText: raw.answerText || description || "",
    attachmentUrls,
    status: raw.status || "PENDING",
    score: raw.score,
    reviewedById: raw.reviewedById ?? null,
    reviewedAt: raw.reviewedAt ?? null,
    submittedAt,
    createdAt: raw.createdAt || submittedAt,
    updatedAt: raw.updatedAt || submittedAt,
    student: raw.student,
    assignment: raw.assignment,
    reviewedBy: raw.reviewedBy,
    feedbacks: Array.isArray(raw.feedbacks) ? raw.feedbacks : [],
    _count: raw._count,
  };
}

export class SubmissionService {
  private isTestEnv(): boolean {
    return (
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "test" ||
        Boolean(process.env.NODE_TEST_CONTEXT) ||
        !process.env.NEXT_PUBLIC_API_BASE_URL)
    );
  }

  /**
   * Lists submissions scoped to the authenticated caller's role.
   * - Students: lists their attempts via /dashboard/student/submissions or /assignments/:id/submissions/me
   * - Mentors / Admins: lists via /mentor/submissions or /assignments/:id/submissions
   */
  async list(
    params?: PaginationParams & { assignmentId?: string; status?: string; studentId?: string },
    user?: CurrentUser | null
  ): Promise<PaginatedResult<Submission>> {
    if (this.isTestEnv()) {
      if (!user) {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: params?.limit ?? 10,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      const allSubmissions = await submissionRepository.list({
        limit: 1000,
        page: 1,
        assignmentId: params?.assignmentId,
      });
      let items = allSubmissions.items;

      if (user.role === "STUDENT") {
        items = items.filter((s) => s.studentId === user.id);
      } else if (user.role === "MENTOR") {
        const allCourses = await courseRepository.list({ limit: 1000, page: 1 });
        const assignedCourseIds = allCourses.items
          .filter((c) => c.mentorIds.includes(user.id))
          .map((c) => c.id);

        const allAssignments = await assignmentRepository.list({ limit: 1000, page: 1 });
        const mentorAssignmentIds = allAssignments.items
          .filter(
            (a) =>
              a.createdById === user.id ||
              (a.courseId && assignedCourseIds.includes(a.courseId))
          )
          .map((a) => a.id);

        items = items.filter((s) => mentorAssignmentIds.includes(s.assignmentId));
      }

      if (params?.status && params.status !== "ALL") {
        items = items.filter((s) => s.status === params.status);
      }

      return paginateArray(items, params?.page, params?.limit);
    }

    if (!user) {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: params?.limit ?? 10,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    const query: Record<string, string | number | undefined> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    };

    if (params?.status && params.status !== "ALL") {
      query.status = params.status;
    }

    if (user.role === "STUDENT") {
      if (params?.assignmentId) {
        const attempts = await apiRequest<unknown[]>(
          `assignments/${params.assignmentId}/submissions/me`,
          { method: "GET" }
        );
        const items = attempts.map(normalizeSubmission);
        return {
          items,
          total: items.length,
          page: 1,
          limit: items.length || 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      // Overall student submissions from student dashboard
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);

      const queryStr = searchParams.toString();
      const path = queryStr
        ? `dashboard/student/submissions?${queryStr}`
        : "dashboard/student/submissions";

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
      });

      return {
        ...response,
        items: (response.items || []).map(normalizeSubmission),
      };
    }

    // Mentor / Admin review queue or assignment specific submissions
    if (params?.assignmentId) {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
      if (params?.studentId) searchParams.set("studentId", params.studentId);

      const queryStr = searchParams.toString();
      const path = queryStr
        ? `assignments/${params.assignmentId}/submissions?${queryStr}`
        : `assignments/${params.assignmentId}/submissions`;

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
      });

      return {
        ...response,
        items: (response.items || []).map(normalizeSubmission),
      };
    }

    // Global / mentor review queue
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
    if (params?.studentId) searchParams.set("studentId", params.studentId);

    const queryStr = searchParams.toString();
    const path = queryStr ? `mentor/submissions?${queryStr}` : "mentor/submissions";

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
    });

    return {
      ...response,
      items: (response.items || []).map(normalizeSubmission),
    };
  }

  /**
   * Retrieves specific submission detail.
   * Connects to GET /api/v1/submissions/:id
   */
  async getById(id: string, user?: CurrentUser | null): Promise<Submission> {
    if (this.isTestEnv()) {
      const submission = await submissionRepository.getById(id);
      if (!submission) {
        throw new Error(`Submission "${id}" was not found.`);
      }

      const assignment = await assignmentRepository.getById(submission.assignmentId);
      let course = undefined;
      if (assignment?.courseId) {
        course = (await courseRepository.getById(assignment.courseId)) ?? undefined;
      }

      if (!canAccessSubmission(user ?? null, submission, course)) {
        throw new Error("Access denied: you do not have permission to view this submission.");
      }

      return submission;
    }

    const raw = await apiRequest<unknown>(`submissions/${id}`, {
      method: "GET",
    });

    return normalizeSubmission(raw);
  }

  /**
   * Lists attempts submitted for a specific assignment.
   */
  async listAttempts(
    assignmentId: string,
    studentId: string,
    user?: CurrentUser | null
  ): Promise<Submission[]> {
    if (this.isTestEnv()) {
      if (!user) return [];
      if (user.role === "STUDENT" && user.id !== studentId) {
        throw new Error("Access denied: cannot view another student's attempt history.");
      }
      return submissionRepository.listAttempts(assignmentId, studentId);
    }

    if (!user) return [];

    if (user.role === "STUDENT" && user.id === studentId) {
      const attempts = await apiRequest<unknown[]>(
        `assignments/${assignmentId}/submissions/me`,
        { method: "GET" }
      );
      return attempts.map(normalizeSubmission);
    }

    // For mentor or admin
    const searchParams = new URLSearchParams();
    searchParams.set("studentId", studentId);
    searchParams.set("limit", "100");

    const response = await apiRequest<{ items: unknown[] }>(
      `assignments/${assignmentId}/submissions?${searchParams.toString()}`,
      {
        method: "GET",
      }
    );

    return (response.items || []).map(normalizeSubmission);
  }

  /**
   * Creates a student submission attempt.
   * Connects to POST /api/v1/assignments/:id/submissions
   */
  async create(
    input: {
      assignmentId: string;
      projectName?: string;
      repoUrl?: string;
      liveUrl?: string | null;
      description?: string | null;
      answerText?: string;
      attachmentUrls?: string[];
    },
    user: CurrentUser | null
  ): Promise<Submission> {
    if (this.isTestEnv()) {
      if (!user) {
        throw new Error("You must be signed in to submit an assignment.");
      }

      if (!hasPermission(user, PERMISSIONS.SUBMISSION_CREATE)) {
        throw new Error("Access denied: you do not have permission to submit assignments.");
      }

      const assignment = await assignmentRepository.getById(input.assignmentId);
      if (!assignment) {
        throw new Error("Assignment not found.");
      }

      if (assignment.status !== "PUBLISHED") {
        throw new Error("Submissions are only accepted for published assignments.");
      }

      const existingAttempts = await submissionRepository.listAttempts(
        input.assignmentId,
        user.id
      );

      if (assignment.submissionPolicy === "ONE_TIME" && existingAttempts.length >= 1) {
        throw new Error(
          "This assignment enforces a single-submission policy. Additional attempts cannot be submitted."
        );
      }

      const attemptNumber = existingAttempts.length + 1;

      return submissionRepository.create({
        assignmentId: input.assignmentId,
        studentId: user.id,
        attemptNumber,
        answerText: input.answerText || input.description || "",
        attachmentUrls:
          input.attachmentUrls ??
          ([input.repoUrl, input.liveUrl].filter(Boolean) as string[]),
        status: "PENDING",
      });
    }

    if (!user) {
      throw new Error("You must be signed in to submit an assignment.");
    }

    // Construct valid backend submission body
    const projectName =
      input.projectName?.trim() ||
      (input.answerText ? input.answerText.slice(0, 50) : "Project Submission");

    const repoUrl =
      input.repoUrl?.trim() ||
      (input.attachmentUrls && input.attachmentUrls[0]?.trim()) ||
      "";

    if (!repoUrl) {
      throw new Error("Repository URL is required.");
    }

    const liveUrl =
      input.liveUrl?.trim() ||
      (input.attachmentUrls && input.attachmentUrls[1]?.trim()) ||
      null;

    const description =
      input.description?.trim() ||
      input.answerText?.trim() ||
      null;

    const body = {
      projectName,
      repoUrl,
      liveUrl,
      description,
    };

    const raw = await apiRequest<unknown>(
      `/assignments/${input.assignmentId}/submissions`,
      {
        method: "POST",
        body,
      }
    );

    return normalizeSubmission(raw);
  }
}

export const submissionService = new SubmissionService();
