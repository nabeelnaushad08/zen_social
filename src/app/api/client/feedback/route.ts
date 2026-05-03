import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { SubmitFeedbackSchema } from "@/lib/validations/client";
import { submitFeedback, getClientFeedbackHistory } from "@/lib/services/client/feedback-service";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await requireClient();
    const history = await getClientFeedbackHistory(session.user.clientId);
    return NextResponse.json(ok(history));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireClient();
    const body = await req.json();
    const input = SubmitFeedbackSchema.parse(body);
    const feedback = await submitFeedback(session.user.clientId, input);
    return NextResponse.json(ok(feedback), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
