import { NotificationType } from "@prisma/client";
import { prisma } from "./db";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

// Fire-and-forget — same pattern as writeAuditLog.
export function createNotification(params: CreateNotificationParams): void {
  prisma.notification
    .create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
      },
    })
    .catch((err) => console.error("[Notification] Failed to create:", err));
}

// Notify all ADMIN users at once (e.g. new design request)
export async function notifyAdmins(params: Omit<CreateNotificationParams, "userId">): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  for (const admin of admins) {
    createNotification({ ...params, userId: admin.id });
  }
}
