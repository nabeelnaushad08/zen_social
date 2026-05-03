import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { UpdateTemplateSchema, PublishTemplateSchema } from "@/lib/validations/admin";
import {
  getTemplate,
  updateTemplate,
  setTemplateStatus,
} from "@/lib/services/admin/template-service";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { templateId: string } },
) {
  try {
    await requireAdmin();
    const template = await getTemplate(params.templateId);
    return NextResponse.json(ok(template));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { templateId: string } },
) {
  try {
    const session = await requireAdmin();
    const body = await req.json();

    // Status change shortcut: { status: "PUBLISHED" | "DRAFT" | "ARCHIVED" }
    if ("status" in body && Object.keys(body).length === 1) {
      const input = PublishTemplateSchema.parse(body);
      const template = await setTemplateStatus(params.templateId, input);
      writeAuditLog({
        userId: session.user.id,
        action: `SET_TEMPLATE_STATUS_${input.status}`,
        entityType: "ContentTemplate",
        entityId: params.templateId,
      });
      return NextResponse.json(ok(template));
    }

    const input = UpdateTemplateSchema.parse(body);
    const template = await updateTemplate(params.templateId, input, session.user.id);
    writeAuditLog({
      userId: session.user.id,
      action: "UPDATED_TEMPLATE",
      entityType: "ContentTemplate",
      entityId: params.templateId,
    });
    return NextResponse.json(ok(template));
  } catch (error) {
    return handleApiError(error);
  }
}
