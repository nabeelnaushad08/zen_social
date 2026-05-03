import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { listFeedback } from "@/lib/services/admin/feedback-service";
import { buildPaginationMeta, ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { feedback, total, page, limit } = await listFeedback(req.nextUrl.searchParams);
    return NextResponse.json(ok(feedback, buildPaginationMeta(total, page, limit)));
  } catch (error) {
    return handleApiError(error);
  }
}
