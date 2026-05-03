import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { listClientDesignRequests } from "@/lib/services/client/design-request-service";
import { buildPaginationMeta, ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireClient();
    const { requests, total, page, limit } = await listClientDesignRequests(
      session.user.clientId,
      req.nextUrl.searchParams,
    );
    return NextResponse.json(ok(requests, buildPaginationMeta(total, page, limit)));
  } catch (error) {
    return handleApiError(error);
  }
}
