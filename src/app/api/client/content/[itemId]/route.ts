import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { UpdateTextFieldsSchema, UpdatePlatformCaptionSchema } from "@/lib/validations/client";
import {
  getContentItem,
  updateTextFields,
  updatePlatformCaption,
} from "@/lib/services/client/content-service";
import { getClientIp, ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { itemId: string } },
) {
  try {
    const session = await requireClient();
    const item = await getContentItem(session.user.clientId, params.itemId);
    return NextResponse.json(ok(item));
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/client/content/[itemId]
// Body variants:
//   { tagline?, caption?, cta? }          → update text fields
//   { platformSlug, caption, hashtags? }  → update platform-specific caption
export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } },
) {
  try {
    const session = await requireClient();
    const body = await req.json();

    if ("platformSlug" in body) {
      const input = UpdatePlatformCaptionSchema.parse(body);
      const result = await updatePlatformCaption(
        session.user.clientId,
        params.itemId,
        input,
        session.user.id,
      );
      return NextResponse.json(ok(result));
    }

    const input = UpdateTextFieldsSchema.parse(body);
    const item = await updateTextFields(
      session.user.clientId,
      params.itemId,
      input,
      session.user.id,
    );
    return NextResponse.json(ok(item));
  } catch (error) {
    return handleApiError(error);
  }
}
