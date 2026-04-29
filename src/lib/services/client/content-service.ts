import { prisma } from "@/lib/db";
import { parsePagination } from "@/lib/utils";
import { ApiError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import type { z } from "zod";
import type { UpdateTextFieldsSchema, UpdatePlatformCaptionSchema } from "@/lib/validations/client";

type UpdateTextFieldsInput = z.infer<typeof UpdateTextFieldsSchema>;
type UpdatePlatformCaptionInput = z.infer<typeof UpdatePlatformCaptionSchema>;

// ─── Select ───────────────────────────────────────────────────────────────────

const contentItemSelect = {
  id: true,
  sortOrder: true,
  tagline: true,
  caption: true,
  cta: true,
  approvalStatus: true,
  isLocked: true,
  updatedAt: true,
  template: {
    select: {
      id: true,
      name: true,
      contentType: true,
      thumbnailUrl: true,
      defaultTagline: true,
      defaultCaption: true,
      defaultCta: true,
      media: {
        select: {
          secureUrl: true,
          format: true,
          resourceType: true,
          width: true,
          height: true,
          duration: true,
        },
      },
    },
  },
  platforms: {
    select: { platform: { select: { id: true, slug: true, name: true, iconUrl: true } } },
  },
  platformCaptions: {
    select: {
      caption: true,
      hashtags: true,
      platform: { select: { id: true, slug: true, name: true } },
    },
  },
  approval: { select: { status: true, approvedAt: true, revisionNote: true } },
  designRequests: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { id: true, status: true, comment: true, createdAt: true },
  },
} as const;

// ─── Get content batch for client ─────────────────────────────────────────────

export async function getClientContent(
  clientId: string,
  searchParams: URLSearchParams,
) {
  const { skip, limit, page } = parsePagination(searchParams);
  const platformSlug = searchParams.get("platform") ?? undefined;
  const approvalStatus = searchParams.get("approvalStatus") ?? undefined;

  // Get the client's most recent published batch (or by month/year if provided)
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

  const batch = await prisma.monthlyBatch.findFirst({
    where: {
      clientId,
      status: "PUBLISHED",
      ...(month && year && { month, year }),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { id: true, month: true, year: true, status: true, dueDate: true, publishedAt: true },
  });

  if (!batch) return { batch: null, items: [], total: 0, page, limit };

  const where = {
    batchId: batch.id,
    ...(approvalStatus && { approvalStatus: approvalStatus as never }),
    ...(platformSlug && {
      platforms: { some: { platform: { slug: platformSlug as never } } },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.monthlyContentItem.findMany({
      where,
      select: contentItemSelect,
      skip,
      take: limit,
      orderBy: { sortOrder: "asc" },
    }),
    prisma.monthlyContentItem.count({ where }),
  ]);

  return { batch, items, total, page, limit };
}

// ─── Get single content item ──────────────────────────────────────────────────

export async function getContentItem(clientId: string, itemId: string) {
  const item = await prisma.monthlyContentItem.findFirst({
    where: {
      id: itemId,
      batch: { clientId }, // tenant isolation
    },
    select: contentItemSelect,
  });
  if (!item) throw new ApiError(404, "Content item not found");
  return item;
}

// ─── Update text fields ───────────────────────────────────────────────────────

export async function updateTextFields(
  clientId: string,
  itemId: string,
  input: UpdateTextFieldsInput,
  userId: string,
) {
  const item = await prisma.monthlyContentItem.findFirst({
    where: { id: itemId, batch: { clientId } },
    select: { id: true, isLocked: true, tagline: true, caption: true, cta: true },
  });
  if (!item) throw new ApiError(404, "Content item not found");
  if (item.isLocked) throw new ApiError(403, "This content item is locked and cannot be edited");

  // Build the history entries only for changed fields
  const historyEntries: { field: string; oldValue: string | null; newValue: string | null }[] = [];

  if (input.tagline !== undefined && input.tagline !== item.tagline) {
    historyEntries.push({ field: "tagline", oldValue: item.tagline, newValue: input.tagline });
  }
  if (input.caption !== undefined && input.caption !== item.caption) {
    historyEntries.push({ field: "caption", oldValue: item.caption, newValue: input.caption });
  }
  if (input.cta !== undefined && input.cta !== item.cta) {
    historyEntries.push({ field: "cta", oldValue: item.cta, newValue: input.cta });
  }

  if (historyEntries.length === 0) return getContentItem(clientId, itemId);

  await prisma.$transaction([
    prisma.monthlyContentItem.update({
      where: { id: itemId },
      data: {
        ...(input.tagline !== undefined && { tagline: input.tagline }),
        ...(input.caption !== undefined && { caption: input.caption }),
        ...(input.cta !== undefined && { cta: input.cta }),
      },
    }),
    prisma.textEditHistory.createMany({
      data: historyEntries.map((h) => ({ contentItemId: itemId, ...h })),
    }),
  ]);

  writeAuditLog({
    userId,
    action: "EDITED_TEXT_FIELDS",
    entityType: "MonthlyContentItem",
    entityId: itemId,
    metadata: { fields: historyEntries.map((h) => h.field) },
  });

  return getContentItem(clientId, itemId);
}

// ─── Update platform-specific caption ────────────────────────────────────────

export async function updatePlatformCaption(
  clientId: string,
  itemId: string,
  input: UpdatePlatformCaptionInput,
  userId: string,
) {
  const item = await prisma.monthlyContentItem.findFirst({
    where: { id: itemId, batch: { clientId } },
    select: { id: true, isLocked: true },
  });
  if (!item) throw new ApiError(404, "Content item not found");
  if (item.isLocked) throw new ApiError(403, "This content item is locked");

  const platform = await prisma.platform.findUnique({ where: { slug: input.platformSlug } });
  if (!platform) throw new ApiError(404, "Platform not found");

  const result = await prisma.contentPlatformCaption.upsert({
    where: { contentItemId_platformId: { contentItemId: itemId, platformId: platform.id } },
    create: {
      contentItemId: itemId,
      platformId: platform.id,
      caption: input.caption,
      hashtags: input.hashtags,
    },
    update: { caption: input.caption, hashtags: input.hashtags },
  });

  writeAuditLog({
    userId,
    action: "EDITED_PLATFORM_CAPTION",
    entityType: "ContentPlatformCaption",
    entityId: result.id,
    metadata: { platformSlug: input.platformSlug },
  });

  return result;
}

// ─── Get client's batch history ───────────────────────────────────────────────

export async function getClientBatchHistory(clientId: string) {
  return prisma.monthlyBatch.findMany({
    where: { clientId, status: { in: ["PUBLISHED", "ARCHIVED"] } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: {
      id: true,
      month: true,
      year: true,
      status: true,
      publishedAt: true,
      dueDate: true,
      _count: { select: { contentItems: true } },
    },
  });
}
