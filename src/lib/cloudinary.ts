import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// ─── Upload signature ─────────────────────────────────────────────────────────
// The browser uploads directly to Cloudinary using these signed params.
// We never route the binary through our server.

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function generateUploadSignature(folder: string): SignedUploadParams {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    folder,
  };
}

// ─── Asset deletion ───────────────────────────────────────────────────────────

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

// ─── Folder conventions ───────────────────────────────────────────────────────
// Centralised so we never have magic strings in route handlers.

export const CloudinaryFolders = {
  templates: (nicheSlug: string) => `zen-social/templates/${nicheSlug}`,
  designRequests: (clientId: string) => `zen-social/design-requests/${clientId}`,
  logos: () => `zen-social/logos`,
} as const;
