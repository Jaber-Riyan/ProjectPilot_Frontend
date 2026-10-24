import type { PaginatedResult } from "@/types/common";

export function paginateArray<T>(
  items: T[],
  page: number = 1,
  limit: number = 10
): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const total = items.length;
  const totalPages = Math.ceil(total / safeLimit) || 1;
  const startIndex = (safePage - 1) * safeLimit;
  const pagedItems = items.slice(startIndex, startIndex + safeLimit);

  return {
    items: pagedItems,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}
