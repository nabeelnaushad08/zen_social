import { z } from "zod";
import { ContentType, PlatformSlug } from "@prisma/client";

// ─── Client ───────────────────────────────────────────────────────────────────

export const CreateClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  businessName: z.string().min(1).max(200),
  nicheId: z.string().cuid(),
  packageId: z.string().cuid(),
  tagline: z.string().max(300).optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
});

export const UpdateClientSchema = CreateClientSchema.omit({ email: true, password: true }).partial();

// ─── Niche ────────────────────────────────────────────────────────────────────

export const CreateNicheSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  iconUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const UpdateNicheSchema = CreateNicheSchema.partial();

// ─── Package ──────────────────────────────────────────────────────────────────

export const CreatePackageCategorySchema = z.object({
  name: z.string().min(1).max(100),
  contentType: z.nativeEnum(ContentType),
  monthlyLimit: z.number().int().min(1).max(500),
  sortOrder: z.number().int().min(0).default(0),
});

export const CreatePackageSchema = z.object({
  name: z.string().min(1).max(100),
  nicheId: z.string().cuid().optional(),
  description: z.string().max(1000).optional(),
  monthlyPostLimit: z.number().int().min(1).max(500),
  price: z.number().min(0).max(99999),
  sortOrder: z.number().int().min(0).default(0),
  categories: z.array(CreatePackageCategorySchema).min(1, "At least one category required"),
});

export const UpdatePackageSchema = CreatePackageSchema.omit({ categories: true }).partial();

// ─── Content Template ─────────────────────────────────────────────────────────

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  contentType: z.nativeEnum(ContentType),
  nicheId: z.string().cuid().optional(),
  packageCategoryId: z.string().cuid().optional(),
  defaultTagline: z.string().max(300).optional(),
  defaultCaption: z.string().max(5000).optional(),
  defaultCta: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).default(0),
  // After Cloudinary upload the client sends these back
  cloudinaryId: z.string().min(1),
  url: z.string().url(),
  secureUrl: z.string().url(),
  format: z.string().min(1),
  resourceType: z.string().min(1),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  duration: z.number().optional(),
  bytes: z.number().int(),
  folder: z.string().optional(),
  altText: z.string().max(300).optional(),
  // Platforms this template is designed for
  platformSlugs: z.array(z.nativeEnum(PlatformSlug)).min(1, "Select at least one platform"),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

export const PublishTemplateSchema = z.object({
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]),
});

// ─── Monthly Batch ────────────────────────────────────────────────────────────

export const CreateBatchSchema = z.object({
  clientId: z.string().cuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export const AddBatchItemSchema = z.object({
  templateId: z.string().cuid(),
  sortOrder: z.number().int().min(0).default(0),
  // Admin can pre-fill or override text
  tagline: z.string().max(300).optional(),
  caption: z.string().max(5000).optional(),
  cta: z.string().max(100).optional(),
  // Platform overrides for this specific item (defaults to template platforms)
  platformSlugs: z.array(z.nativeEnum(PlatformSlug)).optional(),
  // Optional per-platform captions
  platformCaptions: z
    .array(
      z.object({
        platformSlug: z.nativeEnum(PlatformSlug),
        caption: z.string().max(5000),
        hashtags: z.string().max(2000).optional(),
      }),
    )
    .optional(),
});

export const PublishBatchSchema = z.object({
  sendNotification: z.boolean().default(true),
});

// ─── Design Request (Admin side — status update) ──────────────────────────────

export const UpdateDesignRequestSchema = z.object({
  status: z.enum(["IN_PROGRESS", "COMPLETED", "REJECTED"]),
  adminNote: z.string().max(2000).optional(),
});
