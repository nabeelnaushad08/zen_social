import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { CreateTemplateSchema } from "@/lib/validations/admin";
import { listTemplates, createTemplate } from "@/lib/services/admin/template-service";
import { writeAuditLog } from "@/lib/audit";
import { buildPaginationMeta, ok } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { templates, total, page, limit } = await listTemplates(req.nextUrl.searchParams);
    return NextResponse.json(ok(templates, buildPaginationMeta(total, page, limit)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const input = CreateTemplateSchema.parse(body);
    const template = await createTemplate(input, session.user.id);
    writeAuditLog({
      userId: session.user.id,
      action: "CREATED_TEMPLATE",
      entityType: "ContentTemplate",
      entityId: template.id,
    });
    return NextResponse.json(ok(template), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
