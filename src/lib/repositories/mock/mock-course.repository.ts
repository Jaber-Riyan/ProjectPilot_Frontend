import type { ICourseRepository } from "../types";
import type { Course } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import { mockStore } from "@/lib/mock-data/store";
import { paginateArray } from "./pagination-helper";

export class MockCourseRepository implements ICourseRepository {
  async list(params?: PaginationParams): Promise<PaginatedResult<Course>> {
    await mockStore.delay();
    let courses = mockStore.getCourses();

    if (params?.search) {
      const q = params.search.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      );
    }

    if (params?.status) {
      courses = courses.filter((c) => c.status === params.status);
    }

    // Default sort by createdAt descending
    courses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return paginateArray(courses, params?.page, params?.limit);
  }

  async getById(id: string): Promise<Course | null> {
    await mockStore.delay();
    return mockStore.getCourseById(id) || null;
  }

  async create(input: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<Course> {
    await mockStore.delay();
    return mockStore.createCourse(input);
  }

  async update(id: string, updates: Partial<Omit<Course, "id" | "createdAt">>): Promise<Course> {
    await mockStore.delay();
    return mockStore.updateCourse(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    await mockStore.delay();
    return mockStore.deleteCourse(id);
  }
}
