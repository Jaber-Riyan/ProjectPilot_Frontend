import type { IContentRepository } from "../types";
import type { ContentItem } from "@/types/domain";
import { mockStore } from "@/lib/mock-data/store";

export class MockContentRepository implements IContentRepository {
  async list(moduleId?: string): Promise<ContentItem[]> {
    await mockStore.delay();
    return mockStore.getContentItems(moduleId);
  }

  async getById(id: string): Promise<ContentItem | null> {
    await mockStore.delay();
    return mockStore.getContentById(id) || null;
  }

  async create(input: Omit<ContentItem, "id" | "createdAt" | "updatedAt">): Promise<ContentItem> {
    await mockStore.delay();
    return mockStore.createContentItem(input);
  }

  async update(id: string, updates: Partial<Omit<ContentItem, "id" | "createdAt">>): Promise<ContentItem> {
    await mockStore.delay();
    return mockStore.updateContentItem(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    await mockStore.delay();
    return mockStore.deleteContentItem(id);
  }
}
