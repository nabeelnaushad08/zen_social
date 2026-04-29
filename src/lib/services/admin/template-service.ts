import { prisma } from "@/lib/db";
import { parsePagination } from "@/lib/utils";
import { ApiError } from "@/lib/errors";
import type { z } from "zod";
import type {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  PublishTemplateSchema,
} from "@/lib/validations/admin";

type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
type PublishTemplateInput = z.infer<typeof PublishTemplateSchema>;

const templateSelect = {
  id: true,
  name: true,
  description: true,
  contentType: true,
  status: true,
  thumbnailUrl: true,
  defaultTagline: true,
  defaultCaption: true,
  defaultCta: true,
  tags: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  niche: { select: { id: true, name: true, slug: true } },
  packageCategory: { select: { id: true, name: true, contentType: true } },
  media: {
    select: {
      id: true,
      cloudinaryId: true,
      secureUrl: true,
      format: true,
      resourceType: true,
      width: true,
      height: true,
      duration: true,
    },
  },
  platforms: {
    select: { platform: { select: { id: true, slug: true, name: true, iconUrl: true } } },
  },
} as const;

// ─── List templates ───────────────────────────────────────────────────────────

export async function listTemplates(searchParams: URLSearchParams) {
  const { skip, limit, page } = parsePagination(searchParams);
  const search = searchParams.get("search") ?? "";
  const nicheId = searchParams.get("nicheId") ?? undefined;
  const contentType = searchParams.get("contentType") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const platformSlug = searchParams.get("platform") ?? undefined;

  const where = {
    ...(search && { name: { contains: search } }),
    ...(nicheId && { nicheId }),
    ...(contentType && { contentType: contentType as never }),
    ...(status && { status: status as never }),
    ...(platformSlug && {
      platforms: { some: { platform: { slug: platformSlug as never } } },
    }),
  };

  const [templates, total] = await prisma.$transaction([
    prisma.contentTemplate.findMany({
      where,
      select: templateSelect,
      skip,
      take: limit,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.contentTemplate.count({ where }),
  ]);

  return { templates, total, page, limit };
}

// ─── Get single template ──────────────────────────────────────────────────────

export async function getTemplate(templateId: string) {
  const template = await prisma.contentTemplate.findUnique({
    where: { id: templateId },
    select: templateSelect,
  });
  if (!template) throw new ApiError(404, "Template not found");
  return template;
}

// ─── Create template ──────────────────────────────────────────────────────────

export async function createTemplate(input: CreateTemplateInput, uploadedById: string) {
  const { platformSlugs, cloudinaryId, url, secureUrl, format, resourceType, width, height, duration, bytes, folder, altText, ...templateData } = input;

  // Resolve platform IDs from slugs
  const platforms = await prisma.platform.findMany({
    where: { slug: { in: platformSlugs } },
    select: { id: true, slug: true },
  });
  if (platforms.length !== platformSlugs.length) {
    throw new ApiError(400, "One or more platform slugs are invalid");
  }

  return prisma.$transaction(async (tx) => {
    // Upsert Media record (Cloudinary asset)
    const media = await tx.media.upsert({
      where: { cloudinaryId },
      update: {},
      create: {
        cloudinaryId,
        url,
        secureUrl,
        format,
        resourceType,
        width,
        height,
        duration,
        bytes,
        folder,
        altText,
        uploadedById,
      },
    });

    const template = await tx.contentTemplate.create({
      data: {
        ...templateData,
        tags: templateData.tags ? JSON.parse(JSON.stringify(templateData.tags)) : undefined,
        mediaId: media.id,
        thumbnailUrl: secureUrl,
        platforms: {
          create: platforms.map((p) => ({ platformId: p.id })),
        },
      },
      select: templateSelect,
    });

    return template;
  });
}

// ─── Update template ──────────────────────────────────────────────────────────

export async function updateTemplate(templateId: string, input: UpdateTemplateInput, uploadedById: string) {
  await getTemplate(templateId);

  const { platformSlugs, cloudinaryId, url, secureUrl, format, resourceType, width, height, duration, bytes, folder, altText, ...templateData } = input;

  return prisma.$transaction(async (tx) => {
    let mediaId: string | undefined;

    if (cloudinaryId) {
      const media = await tx.media.upsert({
        where: { cloudinaryId },
        update: {},
        create: {
          cloudinaryId,
          url: url!,
          secureUrl: secureUrl!,
          format: format!,
          resourceType: resourceType!,
          width,
          height,
          duration,
          bytes: bytes!,
          folder,
          altText,
          uploadedById,
        },
      });
      mediaId = media.id;
    }

    if (platformSlugs) {
      const platforms = await tx.platform.findMany({
        where: { slug: { in: platformSlugs } },
        select: { id: true },
      });
      await tx.contentTemplatePlatform.deleteMany({ where: { templateId } });
      await tx.contentTemplatePlatform.createMany({
        data: platforms.map((p) => ({ templateId, platformId: p.id })),
      });
    }

    return tx.contentTemplate.update({
      where: { id: templateId },
      data: {
        ...templateData,
        ...(mediaId && { mediaId, thumbnailUrl: secureUrl }),
        tags: templateData.tags ? JSON.parse(JSON.stringify(templateData.tags)) : undefined,
      },
      select: templateSelect,
    });
  });
}

// ─── Publish/archive template ─────────────────────────────────────────────────

export async function setTemplateStatus(templateId: string, input: PublishTemplateInput) {
  await getTemplate(templateId);
  return prisma.contentTemplate.update({
    where: { id: templateId },
    data: { status: input.status },
    select: { id: true, status: true },
  });
}
