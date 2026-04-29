import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { CreatePackageSchema } from "@/lib/validations/admin";
import { listPackages, createPackage } from "@/lib/services/admin/package-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const nicheId = req.nextUrl.searchParams.get("nicheId") ?? undefined;
    const packages = await listPackages(nicheId);
    return NextResponse.json(ok(packages));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const input = CreatePackageSchema.parse(body);
    const pkg = await createPackage(input);
    writeAuditLog({
      userId: session.user.id,
      action: "CREATED_PACKAGE",
      entityType: "Package",
      entityId: pkg.id,
    });
    return NextResponse.json(ok(pkg), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
