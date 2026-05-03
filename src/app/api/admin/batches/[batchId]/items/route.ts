import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { AddBatchItemSchema } from "@/lib/validations/admin";
import { addItemToBatch } from "@/lib/services/admin/batch-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { batchId: string } },
) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const input = AddBatchItemSchema.parse(body);
    const item = await addItemToBatch(params.batchId, input);
    writeAuditLog({
      userId: session.user.id,
      action: "ADDED_ITEM_TO_BATCH",
      entityType: "MonthlyContentItem",
      entityId: item.id,
      metadata: { batchId: params.batchId, templateId: input.templateId },
    });
    return NextResponse.json(ok(item), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
