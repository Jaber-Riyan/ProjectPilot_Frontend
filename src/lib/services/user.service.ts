import { userRepository } from "@/lib/repositories";
import type { User } from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type { CurrentUser } from "@/types/auth";
import { hasPermission } from "@/lib/access/access-control";
import { PERMISSIONS } from "@/lib/access/permissions";

export class UserService {
  async list(params?: PaginationParams & { role?: string }, user?: CurrentUser | null): Promise<PaginatedResult<User>> {
    if (!hasPermission(user ?? null, PERMISSIONS.USER_READ)) {
      throw new Error("Access denied: user directory requires administrative permissions.");
    }

    return userRepository.list(params);
  }

  async getById(id: string, user?: CurrentUser | null): Promise<User> {
    const target = await userRepository.getById(id);
    if (!target) throw new Error(`User "${id}" not found.`);

    if (user?.id !== id && !hasPermission(user ?? null, PERMISSIONS.USER_READ)) {
      throw new Error("Access denied: you cannot view other user profiles.");
    }

    return target;
  }

  async update(id: string, updates: Partial<User>, user: CurrentUser | null): Promise<User> {
    if (!hasPermission(user, PERMISSIONS.USER_MANAGE)) {
      throw new Error("Access denied: modifying users requires administrative permissions.");
    }

    return userRepository.update(id, updates);
  }
}

export const userService = new UserService();
