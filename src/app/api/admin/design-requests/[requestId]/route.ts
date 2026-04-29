import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { UpdateDesignRequestSchema } from "@/lib/validations/admin";
import {
  getDesignRequest,
  updateDesignRequestStatus,
} from "@/lib/services/admin/design-request-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    await requireAdmin();
    const request = await getDesignRequest(params.requestId);
    return NextResponse.json(ok(request));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const input = UpdateDesignRequestSchema.parse(body);
    const request = await updateDesignRequestStatus(params.requestId, input);
    writeAuditLog({
      userId: session.user.id,
      action: `DESIGN_REQUEST_${input.status}`,
      entityType: "DesignRequest",
      entityId: params.requestId,
    });
    return NextResponse.json(ok(request));
  } catch (error) {
    return handleApiError(error);
  }
}
