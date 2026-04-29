import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { getBatch, archiveBatch } from "@/lib/services/admin/batch-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { batchId: string } },
) {
  try {
    await requireAdmin();
    const batch = await getBatch(params.batchId);
    return NextResponse.json(ok(batch));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { batchId: string } },
) {
  try {
    const session = await requireAdmin();
    await archiveBatch(params.batchId);
    writeAuditLog({
      userId: session.user.id,
      action: "ARCHIVED_BATCH",
      entityType: "MonthlyBatch",
      entityId: params.batchId,
    });
    return NextResponse.json(ok({ success: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
