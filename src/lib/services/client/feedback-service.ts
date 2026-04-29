import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { notifyAdmins } from "@/lib/notifications";
import type { z } from "zod";
import type { SubmitFeedbackSchema } from "@/lib/validations/client";

type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;

export async function submitFeedback(clientId: string, input: SubmitFeedbackInput) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, businessName: true },
  });
  if (!client) throw new ApiError(404, "Client not found");

  const feedback = await prisma.feedback.create({
    data: { clientId, ...input },
  });

  notifyAdmins({
    type: "FEEDBACK_RECEIVED",
    title: "New feedback received",
    body: `${client.businessName}: "${input.message.slice(0, 100)}"`,
    link: `/admin/feedback/${feedback.id}`,
  });

  return feedback;
}

export async function getClientFeedbackHistory(clientId: string) {
  return prisma.feedback.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
