export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly skip: number;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export function parsePagination(
  query: { page?: string; limit?: string },
  defaultLimit = 20,
): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
  return { page, limit, total, totalPages };
}
