import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { CreateClientSchema } from "@/lib/validations/admin";
import { listClients, createClient } from "@/lib/services/admin/client-service";
import { writeAuditLog } from "@/lib/audit";
import { buildPaginationMeta, ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { clients, total, page, limit } = await listClients(req.nextUrl.searchParams);
    return NextResponse.json(ok(clients, buildPaginationMeta(total, page, limit)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const input = CreateClientSchema.parse(body);
    const client = await createClient(input);
    writeAuditLog({
      userId: session.user.id,
      action: "CREATED_CLIENT",
      entityType: "Client",
      entityId: client.id,
    });
    return NextResponse.json(ok(client), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
