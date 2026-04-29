import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { UpdateNicheSchema } from "@/lib/validations/admin";
import { getNiche, updateNiche, toggleNicheActive } from "@/lib/services/admin/niche-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { nicheId: string } },
) {
  try {
    await requireAdmin();
    const niche = await getNiche(params.nicheId);
    return NextResponse.json(ok(niche));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { nicheId: string } },
) {
  try {
    const session = await requireAdmin();
    const body = await req.json();

    if ("isActive" in body && Object.keys(body).length === 1) {
      const niche = await toggleNicheActive(params.nicheId, Boolean(body.isActive));
      return NextResponse.json(ok(niche));
    }

    const input = UpdateNicheSchema.parse(body);
    const niche = await updateNiche(params.nicheId, input);
    writeAuditLog({
      userId: session.user.id,
      action: "UPDATED_NICHE",
      entityType: "Niche",
      entityId: params.nicheId,
    });
    return NextResponse.json(ok(niche));
  } catch (error) {
    return handleApiError(error);
  }
}
