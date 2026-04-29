import { prisma } from "@/lib/db";
import { parsePagination } from "@/lib/utils";
import { ApiError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notifications";
import type { z } from "zod";
import type { SubmitDesignRequestSchema } from "@/lib/validations/client";

type SubmitDesignRequestInput = z.infer<typeof SubmitDesignRequestSchema>;

const requestSelect = {
  id: true,
  status: true,
  comment: true,
  adminNote: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  contentItem: {
    select: {
      id: true,
      template: { select: { name: true, thumbnailUrl: true, contentType: true } },
      batch: { select: { month: true, year: true } },
    },
  },
  assets: {
    select: {
      media: { select: { secureUrl: true, format: true, resourceType: true, altText: true } },
    },
  },
} as const;

// ─── Submit design request ────────────────────────────────────────────────────

export async function submitDesignRequest(
  clientId: string,
  contentItemId: string,
  input: SubmitDesignRequestInput,
  userId: string,
) {
  // Verify item belongs to this client
  const item = await prisma.monthlyContentItem.findFirst({
    where: { id: contentItemId, batch: { clientId } },
    select: { id: true },
  });
  if (!item) throw new ApiError(404, "Content item not found");

  // Prevent duplicate open requests for the same item
  const openRequest = await prisma.designRequest.findFirst({
    where: { contentItemId, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });
  if (openRequest) {
    throw new ApiError(409, "An open design request already exists for this item");
  }

  const request = await prisma.$transaction(async (tx) => {
    // Persist any reference assets first
    const mediaIds: string[] = [];
    if (input.assets?.length) {
      for (const asset of input.assets) {
        const media = await tx.media.upsert({
          where: { cloudinaryId: asset.cloudinaryId },
          update: {},
          create: {
            cloudinaryId: asset.cloudinaryId,
            url: asset.url,
            secureUrl: asset.secureUrl,
            format: asset.format,
            resourceType: asset.resourceType,
            width: asset.width,
            height: asset.height,
            bytes: asset.bytes,
            altText: asset.altText,
            folder: `design-requests/${clientId}`,
            uploadedById: userId,
          },
        });
        mediaIds.push(media.id);
      }
    }

    const designRequest = await tx.designRequest.create({
      data: {
        clientId,
        contentItemId,
        comment: input.comment,
        assets: {
          create: mediaIds.map((mediaId) => ({ mediaId })),
        },
      },
      select: requestSelect,
    });

    return designRequest;
  });

  writeAuditLog({
    userId,
    action: "SUBMITTED_DESIGN_REQUEST",
    entityType: "DesignRequest",
    entityId: request.id,
  });

  notifyAdmins({
    type: "DESIGN_REQUEST_UPDATED",
    title: "New design change request",
    body: `A client has submitted a design change request. "${input.comment.slice(0, 80)}…"`,
    link: `/admin/design-requests/${request.id}`,
  });

  return request;
}

// ─── List client's design requests ───────────────────────────────────────────

export async function listClientDesignRequests(
  clientId: string,
  searchParams: URLSearchParams,
) {
  const { skip, limit, page } = parsePagination(searchParams);
  const status = searchParams.get("status") ?? undefined;

  const where = {
    clientId,
    ...(status && { status: status as never }),
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

export async function getClientDesignRequest(clientId: string, requestId: string) {
  const request = await prisma.designRequest.findFirst({
    where: { id: requestId, clientId },
    select: requestSelect,
  });
  if (!request) throw new ApiError(404, "Design request not found");
  return request;
}
