export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function calculatePagination({
  page = 1,
  limit = 10,
  totalItems = 0,
  maxLimit = 100,
}: {
  page?: number;
  limit?: number;
  totalItems?: number;
  maxLimit?: number;
}) {
  const validPage = Math.max(1, Number(page) || 1);
  const validLimit = Math.max(1, Math.min(maxLimit, Number(limit) || 10));
  const totalPages = Math.ceil(totalItems / validLimit);

  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
    pagination: {
      page: validPage,
      limit: validLimit,
      totalItems,
      totalPages,
      hasNextPage: validPage < totalPages,
      hasPreviousPage: validPage > 1,
    } satisfies PaginationMeta,
  };
}
