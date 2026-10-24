import type { ISubmissionRepository } from "../types";
import type { Submission } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import { mockStore } from "@/lib/mock-data/store";
import { paginateArray } from "./pagination-helper";

export class MockSubmissionRepository implements ISubmissionRepository {
  async list(
    params?: PaginationParams & { assignmentId?: string; studentId?: string }
  ): Promise<PaginatedResult<Submission>> {
    await mockStore.delay();
    let submissions = mockStore.getSubmissions();

    if (params?.assignmentId) {
      submissions = submissions.filter((s) => s.assignmentId === params.assignmentId);
    }

    if (params?.studentId) {
      submissions = submissions.filter((s) => s.studentId === params.studentId);
    }

    if (params?.status) {
      submissions = submissions.filter((s) => s.status === params.status);
    }

    // Default sort by submittedAt descending
    submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return paginateArray(submissions, params?.page, params?.limit);
  }

  async getById(id: string): Promise<Submission | null> {
    await mockStore.delay();
    return mockStore.getSubmissionById(id) || null;
  }

  async create(input: Omit<Submission, "id" | "submittedAt">): Promise<Submission> {
    await mockStore.delay();
    return mockStore.createSubmission(input);
  }

  async update(id: string, updates: Partial<Omit<Submission, "id">>): Promise<Submission> {
    await mockStore.delay();
    return mockStore.updateSubmission(id, updates);
  }

  async listAttempts(assignmentId: string, studentId: string): Promise<Submission[]> {
    await mockStore.delay();
    const attempts = mockStore
      .getSubmissions()
      .filter((s) => s.assignmentId === assignmentId && s.studentId === studentId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
    return attempts;
  }
}
