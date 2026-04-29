import { prisma } from "@/lib/db";
import { parsePagination } from "@/lib/utils";
import { ApiError } from "@/lib/errors";
import { createNotification } from "@/lib/notifications";
import type { z } from "zod";
import type { UpdateDesignRequestSchema } from "@/lib/validations/admin";

type UpdateDesignRequestInput = z.infer<typeof UpdateDesignRequestSchema>;

const requestSelect = {
  id: true,
  status: true,
  comment: true,
  adminNote: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, businessName: true, slug: true } },
  contentItem: {
    select: {
      id: true,
      template: { select: { name: true, thumbnailUrl: true, contentType: true } },
      batch: { select: { month: true, year: true } },
    },
  },
  assets: {
    select: {
      media: { select: { secureUrl: true, format: true, resourceType: true } },
    },
  },
} as const;

// ─── List all design requests ─────────────────────────────────────────────────

export async function listDesignRequests(searchParams: URLSearchParams) {
  const { skip, limit, page } = parsePagination(searchParams);
  const status = searchParams.get("status") ?? undefined;
  const clientId = searchParams.get("clientId") ?? undefined;

  const where = {
    ...(status && { status: status as never }),
    ...(clientId && { clientId }),
  };

  const [requests, total] = await prisma.$transaction([
    prisma.designRequest.findMany({
      where,
      select: requestSelect,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.designRequest.count({ where }),
  ]);

  return { requests, total, page, limit };
}

// ─── Get single request ───────────────────────────────────────────────────────

export async function getDesignRequest(requestId: string) {
  const request = await prisma.designRequest.findUnique({
    where: { id: requestId },
    select: requestSelect,
  });
  if (!request) throw new ApiError(404, "Design request not found");
  return request;
}

// ─── Update request status ────────────────────────────────────────────────────

export async function updateDesignRequestStatus(
  requestId: string,
  input: UpdateDesignRequestInput,
) {
  const request = await prisma.designRequest.findUnique({
    where: { id: requestId },
    include: { client: { include: { user: { select: { id: true } } } } },
  });
  if (!request) throw new ApiError(404, "Design request not found");

  const isCompleted = input.status === "COMPLETED";
  const isRejected = input.status === "REJECTED";

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.designRequest.update({
      where: { id: requestId },
      data: {
        status: input.status,
        adminNote: input.adminNote,
        resolvedAt: isCompleted || isRejected ? new Date() : undefined,
      },
      select: requestSelect,
    });

    // Unlock the content item so the client can re-approve when completed
    if (isCompleted) {
      await tx.monthlyContentItem.update({
        where: { id: request.contentItemId },
        data: { isLocked: false, approvalStatus: "PENDING" },
      });
    }

    return result;
  });

  // Notify client of the status change
  const notifTitle = isCompleted
    ? "Design change completed"
    : isRejected
    ? "Design request update"
    : "Design request in progress";
  const notifBody = isCompleted
    ? "Your design change request has been completed. Please review and approve the updated content."
    : input.adminNote ?? `Your design request status: ${input.status}`;

  createNotification({
    userId: request.client.user.id,
    type: "DESIGN_REQUEST_UPDATED",
    title: notifTitle,
    body: notifBody,
    link: `/client/design-requests/${requestId}`,
  });

  return updated;
}
