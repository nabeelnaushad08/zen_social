import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { ok, currentMonthYear } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await requireClient();
    const clientId = session.user.clientId;
    const { month, year } = currentMonthYear();

    // Latest published batch
    const latestBatch = await prisma.monthlyBatch.findFirst({
      where: { clientId, status: "PUBLISHED" },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: {
        id: true,
        month: true,
        year: true,
        dueDate: true,
        publishedAt: true,
        _count: { select: { contentItems: true } },
      },
    });

    // Approval breakdown for latest batch
    let approvalBreakdown: Record<string, number> = {};
    if (latestBatch) {
      const counts = await prisma.monthlyContentItem.groupBy({
        by: ["approvalStatus"],
        where: { batchId: latestBatch.id },
        _count: true,
      });
      approvalBreakdown = Object.fromEntries(counts.map((c) => [c.approvalStatus, c._count]));
    }

    // Open design requests
    const openDesignRequests = await prisma.designRequest.count({
      where: { clientId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });

    // Unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    // Batch history (last 12 months)
    const batchHistory = await prisma.monthlyBatch.findMany({
      where: { clientId, status: { in: ["PUBLISHED", "ARCHIVED"] } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
      select: {
        id: true,
        month: true,
        year: true,
        status: true,
        publishedAt: true,
        _count: { select: { contentItems: true } },
      },
    });

    return NextResponse.json(
      ok({
        latestBatch,
        approvalBreakdown,
        openDesignRequests,
        unreadNotifications,
        batchHistory,
        currentPeriod: { month, year },
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
