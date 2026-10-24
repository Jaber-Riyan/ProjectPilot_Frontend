import type { IAssignmentRepository } from "../types";
import type { Assignment } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import { mockStore } from "@/lib/mock-data/store";
import { paginateArray } from "./pagination-helper";

export class MockAssignmentRepository implements IAssignmentRepository {
  async list(params?: PaginationParams & { courseId?: string }): Promise<PaginatedResult<Assignment>> {
    await mockStore.delay();
    let assignments = mockStore.getAssignments(params?.courseId);

    if (params?.search) {
      const q = params.search.toLowerCase();
      assignments = assignments.filter(
        (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }

    if (params?.status) {
      assignments = assignments.filter((a) => a.status === params.status);
    }

    assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return paginateArray(assignments, params?.page, params?.limit);
  }

  async getById(id: string): Promise<Assignment | null> {
    await mockStore.delay();
    return mockStore.getAssignmentById(id) || null;
  }

  async create(input: Omit<Assignment, "id" | "createdAt" | "updatedAt">): Promise<Assignment> {
    await mockStore.delay();
    return mockStore.createAssignment(input);
  }

  async update(id: string, updates: Partial<Omit<Assignment, "id" | "createdAt">>): Promise<Assignment> {
    await mockStore.delay();
    return mockStore.updateAssignment(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    await mockStore.delay();
    return mockStore.deleteAssignment(id);
  }
}
