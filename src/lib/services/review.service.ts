import { apiRequest } from "@/lib/api/client";
import {
  reviewRepository,
  submissionRepository,
  assignmentRepository,
  courseRepository,
} from "@/lib/repositories";
import type { Review, Submission, SubmissionStatus, ReviewQueueFilters } from "@/types/domain";
import type { PaginatedResult } from "@/types/common";
import type { CurrentUser } from "@/types/auth";
import { hasPermission } from "@/lib/access/access-control";
import { PERMISSIONS } from "@/lib/access/permissions";
import { paginateArray } from "@/lib/repositories/mock/pagination-helper";
import { normalizeSubmission } from "@/lib/services/submission.service";

export class ReviewService {
  private isTestEnv(): boolean {
    return (
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "test" ||
        Boolean(process.env.NODE_TEST_CONTEXT) ||
        !process.env.NEXT_PUBLIC_API_BASE_URL)
    );
  }

  /**
   * Retrieves the mentor review queue.
   * Connects to GET /api/v1/mentor/submissions
   * Accessible by MENTOR and ADMIN.
   */
  async getReviewQueue(
    filters?: ReviewQueueFilters,
    user?: CurrentUser | null
  ): Promise<PaginatedResult<Submission>> {
    if (!user || (!hasPermission(user, PERMISSIONS.REVIEW_CREATE) && user.role !== "MENTOR" && user.role !== "ADMIN")) {
      throw new Error("Access denied: only mentors and administrators can view the review queue.");
    }

    if (this.isTestEnv()) {
      const allSubmissions = await submissionRepository.list({ limit: 1000, page: 1 });
      let items = allSubmissions.items;

      if (user.role === "MENTOR") {
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

      if (filters?.status) {
        items = items.filter((s) => s.status === filters.status);
      } else {
        // By default, queue prioritizes pending/under-review
        items = items.filter(
          (s) => s.status === "PENDING" || s.status === "UNDER_REVIEW"
        );
      }

      if (filters?.assignmentId) {
        items = items.filter((s) => s.assignmentId === filters.assignmentId);
      }
      if (filters?.studentId) {
        items = items.filter((s) => s.studentId === filters.studentId);
      }

      return paginateArray(items, filters?.page, filters?.limit);
    }

    const searchParams = new URLSearchParams();
    if (filters?.page) searchParams.set("page", String(filters.page));
    if (filters?.limit) searchParams.set("limit", String(filters.limit));
    if (filters?.status) searchParams.set("status", filters.status);
    if (filters?.assignmentId) searchParams.set("assignmentId", filters.assignmentId);
    if (filters?.studentId) searchParams.set("studentId", filters.studentId);
    if (filters?.startDate) searchParams.set("startDate", filters.startDate);
    if (filters?.endDate) searchParams.set("endDate", filters.endDate);

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
    }>(path, { method: "GET" });

    return {
      ...response,
      items: (response.items || []).map(normalizeSubmission),
    };
  }

  /**
   * Retrieves detailed submission information for mentor/admin review inspection.
   * Connects to GET /api/v1/mentor/submissions/:submissionId
   */
  async getSubmissionDetailForReview(
    submissionId: string,
    user?: CurrentUser | null
  ): Promise<Submission> {
    if (!user || (user.role !== "MENTOR" && user.role !== "ADMIN")) {
      throw new Error("Access denied: only mentors and administrators can inspect submissions for review.");
    }

    if (this.isTestEnv()) {
      const sub = await submissionRepository.getById(submissionId);
      if (!sub) throw new Error("Submission not found.");
      return sub;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await apiRequest<any>(`mentor/submissions/${submissionId}`, {
      method: "GET",
    });

    return normalizeSubmission(raw);
  }

  /**
   * Retrieves review / latest evaluation by submission ID.
   */
  async getBySubmissionId(submissionId: string): Promise<Review | null> {
    if (this.isTestEnv()) {
      return reviewRepository.getBySubmissionId(submissionId);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submission = await apiRequest<any>(`/submissions/${submissionId}`, {
        method: "GET",
      });

      const feedbacks = Array.isArray(submission.feedbacks) ? submission.feedbacks : [];
      if (feedbacks.length === 0 && submission.status === "PENDING") {
        return null;
      }

      const latestFeedback = feedbacks[0];

      return {
        id: latestFeedback?.id || `rev-${submission.id}`,
        submissionId: submission.id,
        reviewerId: submission.reviewedById || latestFeedback?.mentorId || "",
        feedback: latestFeedback?.comment || "",
        score: submission.score,
        status: submission.status,
        createdAt: latestFeedback?.createdAt || submission.reviewedAt || submission.createdAt,
        updatedAt: latestFeedback?.updatedAt || submission.updatedAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * Applies a review decision (APPROVE, REJECT, RESUBMISSION_REQUESTED, UNDER_REVIEW).
   * Restricted to MENTOR and ADMIN.
   * Connects to POST /api/v1/submissions/:submissionId/review
   */
  async create(
    input: {
      submissionId: string;
      feedback: string;
      status: SubmissionStatus;
      score?: number;
    },
    user: CurrentUser | null
  ): Promise<Review> {
    if (this.isTestEnv()) {
      if (!user || !hasPermission(user, PERMISSIONS.REVIEW_CREATE)) {
        throw new Error("Access denied: you do not have permission to review submissions.");
      }

      const submission = await submissionRepository.getById(input.submissionId);
      if (!submission) {
        throw new Error("Submission not found.");
      }

      // Check mentor scope
      if (user.role === "MENTOR") {
        const assignment = await assignmentRepository.getById(submission.assignmentId);
        if (assignment?.courseId) {
          const course = await courseRepository.getById(assignment.courseId);
          if (!course || !course.mentorIds.includes(user.id)) {
            throw new Error("Access denied: you can only review submissions for courses assigned to you.");
          }
        }
      }

      return reviewRepository.create({
        submissionId: input.submissionId,
        reviewerId: user.id,
        feedback: input.feedback,
        status: input.status,
        score: input.score,
      });
    }

    if (!user || (user.role !== "MENTOR" && user.role !== "ADMIN")) {
      throw new Error("Access denied: only mentors and administrators can review submissions.");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedSubmission = await apiRequest<any>(
      `/submissions/${input.submissionId}/review`,
      {
        method: "POST",
        body: {
          status: input.status,
          comment: input.feedback?.trim() || null,
        },
      }
    );

    const feedbacks = Array.isArray(updatedSubmission.feedbacks)
      ? updatedSubmission.feedbacks
      : [];
    const latestFeedback = feedbacks[0];

    return {
      id: latestFeedback?.id || `rev-${updatedSubmission.id}`,
      submissionId: updatedSubmission.id,
      reviewerId: updatedSubmission.reviewedById || user.id,
      feedback: latestFeedback?.comment || input.feedback,
      score: input.score,
      status: updatedSubmission.status,
      createdAt: latestFeedback?.createdAt || new Date().toISOString(),
      updatedAt: latestFeedback?.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Updates an existing review decision or appends feedback.
   * Connects to PATCH /api/v1/submissions/:submissionId/review
   */
  async update(
    id: string,
    updates: Partial<Omit<Review, "id" | "createdAt">> & { submissionId?: string },
    user: CurrentUser | null
  ): Promise<Review> {
    if (this.isTestEnv()) {
      if (!user || !hasPermission(user, PERMISSIONS.REVIEW_UPDATE)) {
        throw new Error("Access denied: you do not have permission to update reviews.");
      }

      const review = await reviewRepository.getById(id);
      if (!review) throw new Error("Review not found.");

      if (user.role === "MENTOR" && review.reviewerId !== user.id) {
        throw new Error("Access denied: you can only edit your own reviews.");
      }

      return reviewRepository.update(id, updates);
    }

    if (!user || (user.role !== "MENTOR" && user.role !== "ADMIN")) {
      throw new Error("Access denied: only mentors and administrators can update reviews.");
    }

    const submissionId = updates.submissionId || id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedSubmission = await apiRequest<any>(
      `/submissions/${submissionId}/review`,
      {
        method: "PATCH",
        body: {
          status: updates.status,
          comment: updates.feedback?.trim() || undefined,
        },
      }
    );

    const feedbacks = Array.isArray(updatedSubmission.feedbacks)
      ? updatedSubmission.feedbacks
      : [];
    const latestFeedback = feedbacks[0];

    return {
      id: latestFeedback?.id || id,
      submissionId: updatedSubmission.id,
      reviewerId: updatedSubmission.reviewedById || user.id,
      feedback: latestFeedback?.comment || updates.feedback || "",
      score: updates.score,
      status: updatedSubmission.status,
      createdAt: latestFeedback?.createdAt || new Date().toISOString(),
      updatedAt: latestFeedback?.updatedAt || new Date().toISOString(),
    };
  }
}

export const reviewService = new ReviewService();
