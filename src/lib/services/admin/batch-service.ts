import { prisma } from "@/lib/db";
import { parsePagination } from "@/lib/utils";
import { ApiError } from "@/lib/errors";
import { createNotification } from "@/lib/notifications";
import type { z } from "zod";
import type {
  CreateBatchSchema,
  AddBatchItemSchema,
  PublishBatchSchema,
} from "@/lib/validations/admin";

type CreateBatchInput = z.infer<typeof CreateBatchSchema>;
type AddBatchItemInput = z.infer<typeof AddBatchItemSchema>;
type PublishBatchInput = z.infer<typeof PublishBatchSchema>;

const batchItemSelect = {
  id: true,
  sortOrder: true,
  tagline: true,
  caption: true,
  cta: true,
  approvalStatus: true,
  isLocked: true,
  createdAt: true,
  template: {
    select: {
      id: true,
      name: true,
      contentType: true,
      thumbnailUrl: true,
      defaultTagline: true,
      defaultCaption: true,
      defaultCta: true,
      media: { select: { secureUrl: true, format: true, resourceType: true, width: true, height: true } },
    },
  },
  platforms: {
    select: { platform: { select: { id: true, slug: true, name: true } } },
  },
  approval: { select: { status: true, approvedAt: true, revisionNote: true } },
} as const;

// ─── List batches ─────────────────────────────────────────────────────────────

export async function listBatches(searchParams: URLSearchParams) {
  const { skip, limit, page } = parsePagination(searchParams);
  const clientId = searchParams.get("clientId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

  const where = {
    ...(clientId && { clientId }),
    ...(status && { status: status as never }),
    ...(year && { year }),
  };

  const [batches, total] = await prisma.$transaction([
    prisma.monthlyBatch.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        client: { select: { id: true, businessName: true, slug: true } },
        _count: { select: { contentItems: true } },
      },
    }),
    prisma.monthlyBatch.count({ where }),
  ]);

  return { batches, total, page, limit };
}

// ─── Get batch with items ─────────────────────────────────────────────────────

export async function getBatch(batchId: string) {
  const batch = await prisma.monthlyBatch.findUnique({
    where: { id: batchId },
    include: {
      client: { select: { id: true, businessName: true, slug: true, niche: { select: { name: true } } } },
      contentItems: {
        orderBy: { sortOrder: "asc" },
        select: batchItemSelect,
      },
    },
  });
  if (!batch) throw new ApiError(404, "Batch not found");
  return batch;
}

// ─── Create batch ─────────────────────────────────────────────────────────────

export async function createBatch(input: CreateBatchInput) {
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw new ApiError(404, "Client not found");

  const existing = await prisma.monthlyBatch.findUnique({
    where: { clientId_month_year: { clientId: input.clientId, month: input.month, year: input.year } },
  });
  if (existing) throw new ApiError(409, `A batch for ${input.month}/${input.year} already exists for this client`);

  return prisma.monthlyBatch.create({
    data: {
      clientId: input.clientId,
      month: input.month,
      year: input.year,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      notes: input.notes,
    },
  });
}

// ─── Add item to batch ────────────────────────────────────────────────────────

export async function addItemToBatch(batchId: string, input: AddBatchItemInput) {
  const batch = await prisma.monthlyBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new ApiError(404, "Batch not found");
  if (batch.status === "PUBLISHED") throw new ApiError(400, "Cannot add items to a published batch");

  const template = await prisma.contentTemplate.findUnique({
    where: { id: input.templateId },
    include: {
      platforms: { include: { platform: true } },
    },
  });
  if (!template) throw new ApiError(404, "Template not found");

  // Determine which platforms to assign
  const platformSlugs = input.platformSlugs ?? template.platforms.map((p) => p.platform.slug);

  const platforms = await prisma.platform.findMany({
    where: { slug: { in: platformSlugs } },
    select: { id: true, slug: true },
  });

  return prisma.$transaction(async (tx) => {
    const item = await tx.monthlyContentItem.create({
      data: {
        batchId,
        templateId: input.templateId,
        sortOrder: input.sortOrder,
        tagline: input.tagline ?? template.defaultTagline ?? null,
        caption: input.caption ?? template.defaultCaption ?? null,
        cta: input.cta ?? template.defaultCta ?? null,
        platforms: {
          create: platforms.map((p) => ({ platformId: p.id })),
        },
        approval: { create: { status: "PENDING" } },
      },
      select: batchItemSelect,
    });

    // Create platform-specific captions if provided
    if (input.platformCaptions?.length) {
      const platformMap = Object.fromEntries(platforms.map((p) => [p.slug, p.id]));
      for (const pc of input.platformCaptions) {
        const platformId = platformMap[pc.platformSlug];
        if (!platformId) continue;
        await tx.contentPlatformCaption.create({
          data: {
            contentItemId: item.id,
            platformId,
            caption: pc.caption,
            hashtags: pc.hashtags,
          },
        });
      }
    }

    return item;
  });
}

// ─── Remove item from batch ───────────────────────────────────────────────────

export async function removeItemFromBatch(batchId: string, itemId: string) {
  const batch = await prisma.monthlyBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new ApiError(404, "Batch not found");
  if (batch.status === "PUBLISHED") throw new ApiError(400, "Cannot remove items from a published batch");

  const item = await prisma.monthlyContentItem.findFirst({
    where: { id: itemId, batchId },
  });
  if (!item) throw new ApiError(404, "Item not found in this batch");

  await prisma.monthlyContentItem.delete({ where: { id: itemId } });
}

// ─── Publish batch ────────────────────────────────────────────────────────────

export async function publishBatch(batchId: string, input: PublishBatchInput) {
  const batch = await prisma.monthlyBatch.findUnique({
    where: { id: batchId },
    include: {
      client: { include: { user: { select: { id: true } } } },
      _count: { select: { contentItems: true } },
    },
  });
  if (!batch) throw new ApiError(404, "Batch not found");
  if (batch.status === "PUBLISHED") throw new ApiError(400, "Batch is already published");
  if (batch._count.contentItems === 0) throw new ApiError(400, "Cannot publish an empty batch");

  const published = await prisma.monthlyBatch.update({
    where: { id: batchId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  if (input.sendNotification) {
    createNotification({
      userId: batch.client.user.id,
      type: "BATCH_PUBLISHED",
      title: "Your content is ready for review",
      body: `Your ${batch.month}/${batch.year} content batch has been published. Review and approve your content.`,
      link: `/client/content`,
    });
  }

  return published;
}

// ─── Archive batch ────────────────────────────────────────────────────────────

export async function archiveBatch(batchId: string) {
  await getBatch(batchId);
  return prisma.monthlyBatch.update({
    where: { id: batchId },
    data: { status: "ARCHIVED" },
  });
}
