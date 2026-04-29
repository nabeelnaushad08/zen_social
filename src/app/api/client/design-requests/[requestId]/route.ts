import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { getClientDesignRequest } from "@/lib/services/client/design-request-service";
import { ok } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const session = await requireClient();
    const request = await getClientDesignRequest(session.user.clientId, params.requestId);
    return NextResponse.json(ok(request));
  } catch (error) {
    return handleApiError(error);
  }
}
