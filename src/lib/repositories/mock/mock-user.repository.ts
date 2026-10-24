import type { IUserRepository } from "../types";
import type { User } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import { mockStore } from "@/lib/mock-data/store";
import { paginateArray } from "./pagination-helper";

export class MockUserRepository implements IUserRepository {
  async list(params?: PaginationParams & { role?: string }): Promise<PaginatedResult<User>> {
    await mockStore.delay();
    let users = mockStore.getUsers();

    if (params?.search) {
      const q = params.search.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (params?.role) {
      users = users.filter((u) => u.role === params.role);
    }

    if (params?.status) {
      users = users.filter((u) => u.status === params.status);
    }

    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return paginateArray(users, params?.page, params?.limit);
  }

  async getById(id: string): Promise<User | null> {
    await mockStore.delay();
    return mockStore.getUserById(id) || null;
  }

  async getByEmail(email: string): Promise<User | null> {
    await mockStore.delay();
    return mockStore.getUserByEmail(email) || null;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    await mockStore.delay();
    return mockStore.updateUser(id, updates);
  }
}
