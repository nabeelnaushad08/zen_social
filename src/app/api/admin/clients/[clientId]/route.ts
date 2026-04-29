import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { UpdateClientSchema } from "@/lib/validations/admin";
import { getClient, updateClient, setClientActive } from "@/lib/services/admin/client-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  try {
    await requireAdmin();
    const client = await getClient(params.clientId);
    return NextResponse.json(ok(client));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  try {
    const session = await requireAdmin();
    const body = await req.json();

    // Handle activation toggle separately
    if ("isActive" in body && Object.keys(body).length === 1) {
      await setClientActive(params.clientId, Boolean(body.isActive));
      writeAuditLog({
        userId: session.user.id,
        action: body.isActive ? "ACTIVATED_CLIENT" : "DEACTIVATED_CLIENT",
        entityType: "Client",
        entityId: params.clientId,
      });
      return NextResponse.json(ok({ success: true }));
    }

    const input = UpdateClientSchema.parse(body);
    const client = await updateClient(params.clientId, input);
    writeAuditLog({
      userId: session.user.id,
      action: "UPDATED_CLIENT",
      entityType: "Client",
      entityId: params.clientId,
    });
    return NextResponse.json(ok(client));
  } catch (error) {
    return handleApiError(error);
  }
}
