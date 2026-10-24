import {
  reviewRepository,
  submissionRepository,
  assignmentRepository,
  courseRepository,
} from "@/lib/repositories";
import type { Review, SubmissionStatus } from "@/types/domain";
import type { CurrentUser } from "@/types/auth";
import { hasPermission } from "@/lib/access/access-control";
import { PERMISSIONS } from "@/lib/access/permissions";

export class ReviewService {
  async getBySubmissionId(submissionId: string): Promise<Review | null> {
    return reviewRepository.getBySubmissionId(submissionId);
  }

  async create(
    input: {
      submissionId: string;
      feedback: string;
      status: SubmissionStatus;
      score?: number;
    },
    user: CurrentUser | null
  ): Promise<Review> {
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

  async update(
    id: string,
    updates: Partial<Omit<Review, "id" | "createdAt" | "submissionId">>,
    user: CurrentUser | null
  ): Promise<Review> {
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
}

export const reviewService = new ReviewService();
