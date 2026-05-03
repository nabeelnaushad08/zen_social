import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { SubmitDesignRequestSchema } from "@/lib/validations/client";
import { submitDesignRequest } from "@/lib/services/client/design-request-service";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { itemId: string } },
) {
  try {
    const session = await requireClient();
    const body = await req.json();
    const input = SubmitDesignRequestSchema.parse(body);
    const request = await submitDesignRequest(
      session.user.clientId,
      params.itemId,
      input,
      session.user.id,
    );
    return NextResponse.json(ok(request), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
