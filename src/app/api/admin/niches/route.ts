import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { CreateNicheSchema } from "@/lib/validations/admin";
import { listNiches, createNiche } from "@/lib/services/admin/niche-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";
    const niches = await listNiches(includeInactive);
    return NextResponse.json(ok(niches));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const input = CreateNicheSchema.parse(body);
    const niche = await createNiche(input);
    writeAuditLog({
      userId: session.user.id,
      action: "CREATED_NICHE",
      entityType: "Niche",
      entityId: niche.id,
    });
    return NextResponse.json(ok(niche), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
