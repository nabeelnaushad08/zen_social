import { prisma } from "@/lib/db";
import { parsePagination } from "@/lib/utils";
import { ApiError } from "@/lib/errors";

export async function listFeedback(searchParams: URLSearchParams) {
  const { skip, limit, page } = parsePagination(searchParams);
  const type = searchParams.get("type") ?? undefined;
  const isRead = searchParams.get("isRead");
  const clientId = searchParams.get("clientId") ?? undefined;

  const where = {
    ...(type && { type }),
    ...(clientId && { clientId }),
    ...(isRead !== null && { isRead: isRead === "true" }),
  };

  const [feedback, total] = await prisma.$transaction([
    prisma.feedback.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, businessName: true, slug: true } },
      },
    }),
    prisma.feedback.count({ where }),
  ]);

  return { feedback, total, page, limit };
}

export async function getFeedback(feedbackId: string) {
  const item = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: { client: { select: { id: true, businessName: true } } },
  });
  if (!item) throw new ApiError(404, "Feedback not found");
  return item;
}

export async function markFeedbackRead(feedbackId: string, isRead: boolean) {
  await getFeedback(feedbackId);
  return prisma.feedback.update({ where: { id: feedbackId }, data: { isRead } });
}

export async function respondToFeedback(feedbackId: string, adminResponse: string) {
  await getFeedback(feedbackId);
  return prisma.feedback.update({
    where: { id: feedbackId },
    data: { adminResponse, isRead: true },
  });
}

export async function getUnreadFeedbackCount() {
  return prisma.feedback.count({ where: { isRead: false } });
}
