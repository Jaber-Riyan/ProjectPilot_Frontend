import type { IReviewRepository } from "../types";
import type { Review } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import { mockStore } from "@/lib/mock-data/store";
import { paginateArray } from "./pagination-helper";

export class MockReviewRepository implements IReviewRepository {
  async list(
    params?: PaginationParams & { submissionId?: string; reviewerId?: string }
  ): Promise<PaginatedResult<Review>> {
    await mockStore.delay();
    let reviews = mockStore.getReviews(params?.submissionId);

    if (params?.reviewerId) {
      reviews = reviews.filter((r) => r.reviewerId === params.reviewerId);
    }

    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return paginateArray(reviews, params?.page, params?.limit);
  }

  async getById(id: string): Promise<Review | null> {
    await mockStore.delay();
    return mockStore.getReviewById(id) || null;
  }

  async getBySubmissionId(submissionId: string): Promise<Review | null> {
    await mockStore.delay();
    const reviews = mockStore.getReviews(submissionId);
    return reviews.length > 0 ? reviews[reviews.length - 1] : null;
  }

  async create(input: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<Review> {
    await mockStore.delay();
    return mockStore.createReview(input);
  }

  async update(id: string, updates: Partial<Omit<Review, "id" | "createdAt">>): Promise<Review> {
    await mockStore.delay();
    return mockStore.updateReview(id, updates);
  }
}
