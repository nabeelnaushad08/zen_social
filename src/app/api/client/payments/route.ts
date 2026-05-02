import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  try {
    const session = await requireClient();
    const payments = await prisma.payment.findMany({
      where: { clientId: session.user.clientId },
      orderBy: { dueDate: "desc" },
    });
    return NextResponse.json(ok(payments));
  } catch (error) {
    return handleApiError(error);
  }
}
