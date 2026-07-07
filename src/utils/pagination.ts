export interface PaginationInput {
  page?: number;
  limit?: number;
}

export function getPagination(input: PaginationInput) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
}
