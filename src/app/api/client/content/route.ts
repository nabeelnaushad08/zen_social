import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { getClientContent } from "@/lib/services/client/content-service";
import { buildPaginationMeta, ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/client/content
// Query params: platform, approvalStatus, month, year, page, limit
export async function GET(req: NextRequest) {
  try {
    const session = await requireClient();
    const { batch, items, total, page, limit } = await getClientContent(
      session.user.clientId,
      req.nextUrl.searchParams,
    );
    return NextResponse.json(ok({ batch, items }, buildPaginationMeta(total, page, limit)));
  } catch (error) {
    return handleApiError(error);
  }
}
