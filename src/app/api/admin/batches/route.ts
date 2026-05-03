import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { CreateBatchSchema } from "@/lib/validations/admin";
import { listBatches, createBatch } from "@/lib/services/admin/batch-service";
import { writeAuditLog } from "@/lib/audit";
import { buildPaginationMeta, ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { batches, total, page, limit } = await listBatches(req.nextUrl.searchParams);
    return NextResponse.json(ok(batches, buildPaginationMeta(total, page, limit)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const input = CreateBatchSchema.parse(body);
    const batch = await createBatch(input);
    writeAuditLog({
      userId: session.user.id,
      action: "CREATED_BATCH",
      entityType: "MonthlyBatch",
      entityId: batch.id,
      metadata: { clientId: input.clientId, month: input.month, year: input.year },
    });
    return NextResponse.json(ok(batch), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
