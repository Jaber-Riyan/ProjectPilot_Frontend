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

export class SubmissionService {
  async list(
    params?: PaginationParams & { assignmentId?: string },
    user?: CurrentUser | null
  ): Promise<PaginatedResult<Submission>> {
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
      // Scoped strictly to student's own submissions
      items = items.filter((s) => s.studentId === user.id);
    } else if (user.role === "MENTOR") {
      // Scoped strictly to assignments belonging to courses assigned to this mentor
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
    // Admin gets all

    if (params?.status) {
      items = items.filter((s) => s.status === params.status);
    }

    return paginateArray(items, params?.page, params?.limit);
  }

  async getById(id: string, user?: CurrentUser | null): Promise<Submission> {
    const submission = await submissionRepository.getById(id);
    if (!submission) {
      throw new Error(`Submission "${id}" was not found.`);
    }

    // Find assignment and course for scope verification
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

  async listAttempts(assignmentId: string, studentId: string, user?: CurrentUser | null): Promise<Submission[]> {
    if (!user) return [];

    // Students can only see their own attempts
    if (user.role === "STUDENT" && user.id !== studentId) {
      throw new Error("Access denied: cannot view another student's attempt history.");
    }

    return submissionRepository.listAttempts(assignmentId, studentId);
  }

  async create(
    input: {
      assignmentId: string;
      answerText?: string;
      attachmentUrls?: string[];
    },
    user: CurrentUser | null
  ): Promise<Submission> {
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

    // Check attempt history
    const existingAttempts = await submissionRepository.listAttempts(input.assignmentId, user.id);

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
      answerText: input.answerText,
      attachmentUrls: input.attachmentUrls ?? [],
      status: "PENDING",
    });
  }
}

export const submissionService = new SubmissionService();
