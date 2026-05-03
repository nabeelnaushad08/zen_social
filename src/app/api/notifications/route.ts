import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { parsePagination, buildPaginationMeta, ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/notifications — returns paginated notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { skip, limit, page } = parsePagination(req.nextUrl.searchParams, 50);
    const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";

    const where = {
      userId: session.user.id,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return NextResponse.json(
      ok({ notifications, unreadCount }, buildPaginationMeta(total, page, limit)),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json(ok({ success: true }));
    }

    if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: session.user.id },
        data: { isRead: true },
      });
      return NextResponse.json(ok({ success: true }));
    }

    return NextResponse.json({ error: "Specify id or markAllRead" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
