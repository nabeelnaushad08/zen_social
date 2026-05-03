import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { PublishBatchSchema } from "@/lib/validations/admin";
import { publishBatch } from "@/lib/services/admin/batch-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { batchId: string } },
) {
  try {
    const session = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const input = PublishBatchSchema.parse(body);
    const batch = await publishBatch(params.batchId, input);
    writeAuditLog({
      userId: session.user.id,
      action: "PUBLISHED_BATCH",
      entityType: "MonthlyBatch",
      entityId: params.batchId,
    });
    return NextResponse.json(ok(batch));
  } catch (error) {
    return handleApiError(error);
  }
}
