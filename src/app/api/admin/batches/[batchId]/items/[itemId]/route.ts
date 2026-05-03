import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { removeItemFromBatch } from "@/lib/services/admin/batch-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { batchId: string; itemId: string } },
) {
  try {
    const session = await requireAdmin();
    await removeItemFromBatch(params.batchId, params.itemId);
    writeAuditLog({
      userId: session.user.id,
      action: "REMOVED_ITEM_FROM_BATCH",
      entityType: "MonthlyContentItem",
      entityId: params.itemId,
      metadata: { batchId: params.batchId },
    });
    return NextResponse.json(ok({ success: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
