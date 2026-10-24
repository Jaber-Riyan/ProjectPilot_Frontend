/**
 * These are intentionally only starter types.
 * Replace/extend them from the verified backend schemas and API integration guide.
 */
export type UserRole = "STUDENT" | "MENTOR" | "ADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
