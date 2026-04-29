import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notifications";
import type { z } from "zod";
import type { ApproveContentSchema, RequestRevisionSchema } from "@/lib/validations/client";

type ApproveContentInput = z.infer<typeof ApproveContentSchema>;
type RequestRevisionInput = z.infer<typeof RequestRevisionSchema>;

// ─── Approve content item ─────────────────────────────────────────────────────

export async function approveContentItem(
  clientId: string,
  itemId: string,
  input: ApproveContentInput,
  userId: string,
  ipAddress: string,
) {
  const item = await prisma.monthlyContentItem.findFirst({
    where: { id: itemId, batch: { clientId } },
    select: { id: true, isLocked: true, approvalStatus: true, batchId: true },
  });
  if (!item) throw new ApiError(404, "Content item not found");
  if (item.isLocked) throw new ApiError(403, "This item is locked");
  if (item.approvalStatus === "APPROVED") throw new ApiError(400, "Already approved");

  await prisma.$transaction([
    prisma.monthlyContentItem.update({
      where: { id: itemId },
      data: { approvalStatus: "APPROVED", isLocked: true },
    }),
    prisma.approval.upsert({
      where: { contentItemId: itemId },
      create: {
        contentItemId: itemId,
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByIp: ipAddress,
        revisionNote: null,
      },
      update: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByIp: ipAddress,
        revisionNote: null,
      },
    }),
  ]);

  writeAuditLog({
    userId,
    action: "APPROVED_CONTENT",
    entityType: "MonthlyContentItem",
    entityId: itemId,
    ipAddress,
  });

  // Check if all items in the batch are approved — notify admins
  await checkBatchCompletion(item.batchId, clientId);

  return prisma.approval.findUnique({ where: { contentItemId: itemId } });
}

// ─── Request revision ─────────────────────────────────────────────────────────

export async function requestRevision(
  clientId: string,
  itemId: string,
  input: RequestRevisionInput,
  userId: string,
  ipAddress: string,
) {
  const item = await prisma.monthlyContentItem.findFirst({
    where: { id: itemId, batch: { clientId } },
    select: { id: true, isLocked: true, approvalStatus: true },
  });
  if (!item) throw new ApiError(404, "Content item not found");

  await prisma.$transaction([
    prisma.monthlyContentItem.update({
      where: { id: itemId },
      data: { approvalStatus: "REVISION_REQUESTED", isLocked: false },
    }),
    prisma.approval.upsert({
      where: { contentItemId: itemId },
      create: {
        contentItemId: itemId,
        status: "REVISION_REQUESTED",
        revisionNote: input.revisionNote,
        approvedAt: null,
        approvedByIp: null,
      },
      update: {
        status: "REVISION_REQUESTED",
        revisionNote: input.revisionNote,
        approvedAt: null,
      },
    }),
  ]);

  writeAuditLog({
    userId,
    action: "REQUESTED_REVISION",
    entityType: "MonthlyContentItem",
    entityId: itemId,
    metadata: { revisionNote: input.revisionNote },
    ipAddress,
  });

  notifyAdmins({
    type: "CONTENT_APPROVED",
    title: "Revision requested",
    body: `A client has requested a revision. Note: ${input.revisionNote.slice(0, 100)}`,
    link: `/admin/clients/${clientId}`,
  });

  return prisma.approval.findUnique({ where: { contentItemId: itemId } });
}

// ─── Get approval history ─────────────────────────────────────────────────────

export async function getApprovalHistory(clientId: string) {
  return prisma.monthlyContentItem.findMany({
    where: {
      batch: { clientId },
      approvalStatus: { in: ["APPROVED", "REVISION_REQUESTED"] },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      approvalStatus: true,
      updatedAt: true,
      approval: { select: { approvedAt: true, revisionNote: true } },
      template: { select: { name: true, contentType: true, thumbnailUrl: true } },
      batch: { select: { month: true, year: true } },
    },
  });
}

// ─── Internal: check if entire batch is approved ──────────────────────────────

async function checkBatchCompletion(batchId: string, clientId: string): Promise<void> {
  const counts = await prisma.monthlyContentItem.groupBy({
    by: ["approvalStatus"],
    where: { batchId },
    _count: true,
  });

  const total = counts.reduce((sum, c) => sum + c._count, 0);
  const approved = counts.find((c) => c.approvalStatus === "APPROVED")?._count ?? 0;

  if (approved === total && total > 0) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { businessName: true },
    });

    notifyAdmins({
      type: "CONTENT_APPROVED",
      title: "All content approved",
      body: `${client?.businessName ?? "A client"} has approved all items in their content batch.`,
      link: `/admin/batches/${batchId}`,
    });
  }
}
