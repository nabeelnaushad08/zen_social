import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { ApproveContentSchema } from "@/lib/validations/client";
import { approveContentItem } from "@/lib/services/client/approval-service";
import { getClientIp, ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { itemId: string } },
) {
  try {
    const session = await requireClient();
    const body = await req.json().catch(() => ({}));
    const input = ApproveContentSchema.parse(body);
    const approval = await approveContentItem(
      session.user.clientId,
      params.itemId,
      input,
      session.user.id,
      getClientIp(req),
    );
    return NextResponse.json(ok(approval));
  } catch (error) {
    return handleApiError(error);
  }
}
