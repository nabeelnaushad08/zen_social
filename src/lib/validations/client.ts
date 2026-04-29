import { z } from "zod";
import { PlatformSlug } from "@prisma/client";

// ─── Text edits ───────────────────────────────────────────────────────────────

export const UpdateTextFieldsSchema = z.object({
  tagline: z.string().max(300).optional(),
  caption: z.string().max(5000).optional(),
  cta: z.string().max(100).optional(),
});

// ─── Platform-specific caption ────────────────────────────────────────────────

export const UpdatePlatformCaptionSchema = z.object({
  platformSlug: z.nativeEnum(PlatformSlug),
  caption: z.string().max(5000),
  hashtags: z.string().max(2000).optional(),
});

// ─── Approval ─────────────────────────────────────────────────────────────────

export const ApproveContentSchema = z.object({
  // Client may optionally add a comment when approving
  comment: z.string().max(1000).optional(),
});

export const RequestRevisionSchema = z.object({
  revisionNote: z.string().min(10, "Please describe the revision needed").max(2000),
});

// ─── Design change request ────────────────────────────────────────────────────

export const SubmitDesignRequestSchema = z.object({
  comment: z.string().min(10, "Please describe what you'd like changed").max(3000),
  // Optional reference assets already uploaded to Cloudinary
  assets: z
    .array(
      z.object({
        cloudinaryId: z.string().min(1),
        url: z.string().url(),
        secureUrl: z.string().url(),
        format: z.string().min(1),
        resourceType: z.string().min(1),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
        bytes: z.number().int(),
        altText: z.string().max(300).optional(),
      }),
    )
    .max(5, "Maximum 5 reference files")
    .optional(),
});

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const SubmitFeedbackSchema = z.object({
  type: z.enum(["general", "content", "platform", "support", "billing"]),
  message: z.string().min(5).max(3000),
  rating: z.number().int().min(1).max(5).optional(),
});
