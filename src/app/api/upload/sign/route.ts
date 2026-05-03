import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { generateUploadSignature, CloudinaryFolders } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// POST /api/upload/sign
// Body: { context: "template" | "design-request", nicheSlug?: string }
// Returns signed upload params for direct browser-to-Cloudinary upload.
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { context, nicheSlug } = body as { context?: string; nicheSlug?: string };

    let folder: string;

    if (context === "template") {
      // Only admins can upload templates
      if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      folder = CloudinaryFolders.templates(nicheSlug ?? "general");
    } else if (context === "design-request") {
      // Clients upload reference files for design requests
      if (!session.user.clientId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      folder = CloudinaryFolders.designRequests(session.user.clientId);
    } else if (context === "logo") {
      folder = CloudinaryFolders.logos();
    } else {
      return NextResponse.json({ error: "Invalid upload context" }, { status: 400 });
    }

    const params = generateUploadSignature(folder);
    return NextResponse.json(params);
  } catch (error) {
    return handleApiError(error);
  }
}
