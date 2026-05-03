import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/platforms — list all active platforms (used by both admin and client)
export async function GET() {
  try {
    await requireAuth();
    const platforms = await prisma.platform.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(ok(platforms));
  } catch (error) {
    return handleApiError(error);
  }
}
