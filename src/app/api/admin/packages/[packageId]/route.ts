import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { UpdatePackageSchema } from "@/lib/validations/admin";
import {
  getPackage,
  updatePackage,
  togglePackageActive,
} from "@/lib/services/admin/package-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { packageId: string } },
) {
  try {
    await requireAdmin();
    const pkg = await getPackage(params.packageId);
    return NextResponse.json(ok(pkg));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { packageId: string } },
) {
  try {
    const session = await requireAdmin();
    const body = await req.json();

    if ("isActive" in body && Object.keys(body).length === 1) {
      const pkg = await togglePackageActive(params.packageId, Boolean(body.isActive));
      return NextResponse.json(ok(pkg));
    }

    const input = UpdatePackageSchema.parse(body);
    const pkg = await updatePackage(params.packageId, input);
    writeAuditLog({
      userId: session.user.id,
      action: "UPDATED_PACKAGE",
      entityType: "Package",
      entityId: params.packageId,
    });
    return NextResponse.json(ok(pkg));
  } catch (error) {
    return handleApiError(error);
  }
}
