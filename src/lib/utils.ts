// ─── Slug generation ──────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(
  searchParams: URLSearchParams,
  maxLimit = 100,
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { data, ...(meta ? { meta } : {}) };
}

// ─── Current month/year ───────────────────────────────────────────────────────

export function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// ─── IP extraction ────────────────────────────────────────────────────────────

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
