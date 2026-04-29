import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { getFeedback, markFeedbackRead } from "@/lib/services/admin/feedback-service";
import { ok } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { feedbackId: string } },
) {
  try {
    await requireAdmin();
    const item = await getFeedback(params.feedbackId);
    // Auto-mark read on open
    if (!item.isRead) await markFeedbackRead(params.feedbackId, true);
    return NextResponse.json(ok(item));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { feedbackId: string } },
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const item = await markFeedbackRead(params.feedbackId, Boolean(body.isRead));
    return NextResponse.json(ok(item));
  } catch (error) {
    return handleApiError(error);
  }
}
