import type { IModuleRepository } from "../types";
import type { CourseModule } from "@/types/domain";
import { mockStore } from "@/lib/mock-data/store";

export class MockModuleRepository implements IModuleRepository {
  async list(courseId?: string): Promise<CourseModule[]> {
    await mockStore.delay();
    return mockStore.getModules(courseId);
  }

  async getById(id: string): Promise<CourseModule | null> {
    await mockStore.delay();
    return mockStore.getModuleById(id) || null;
  }

  async create(input: Omit<CourseModule, "id" | "createdAt" | "updatedAt">): Promise<CourseModule> {
    await mockStore.delay();
    return mockStore.createModule(input);
  }

  async update(id: string, updates: Partial<Omit<CourseModule, "id" | "createdAt">>): Promise<CourseModule> {
    await mockStore.delay();
    return mockStore.updateModule(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    await mockStore.delay();
    return mockStore.deleteModule(id);
  }
}
