import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { getApprovalHistory } from "@/lib/services/client/approval-service";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/client/approvals — full approval history for the client
export async function GET(_req: NextRequest) {
  try {
    const session = await requireClient();
    const history = await getApprovalHistory(session.user.clientId);
    return NextResponse.json(ok(history));
  } catch (error) {
    return handleApiError(error);
  }
}
