import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { listDesignRequests } from "@/lib/services/admin/design-request-service";
import { buildPaginationMeta, ok } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { requests, total, page, limit } = await listDesignRequests(req.nextUrl.searchParams);
    return NextResponse.json(ok(requests, buildPaginationMeta(total, page, limit)));
  } catch (error) {
    return handleApiError(error);
  }
}
