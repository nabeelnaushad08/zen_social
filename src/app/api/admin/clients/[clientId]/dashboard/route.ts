import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { getClientDashboard } from "@/lib/services/admin/client-service";
import { ok } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  try {
    await requireAdmin();
    const dashboard = await getClientDashboard(params.clientId);
    return NextResponse.json(ok(dashboard));
  } catch (error) {
    return handleApiError(error);
  }
}
