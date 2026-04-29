import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify, parsePagination } from "@/lib/utils";
import { ApiError } from "@/lib/errors";
import type { z } from "zod";
import type { CreateClientSchema, UpdateClientSchema } from "@/lib/validations/admin";

type CreateClientInput = z.infer<typeof CreateClientSchema>;
type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

// ─── Selects ──────────────────────────────────────────────────────────────────

const clientSelect = {
  id: true,
  businessName: true,
  slug: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
  tagline: true,
  website: true,
  phone: true,
  address: true,
  isActive: true,
  onboardedAt: true,
  createdAt: true,
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
  niche: { select: { id: true, name: true, slug: true } },
  package: { select: { id: true, name: true, slug: true, monthlyPostLimit: true } },
} as const;

// ─── List clients ─────────────────────────────────────────────────────────────

export async function listClients(searchParams: URLSearchParams) {
  const { skip, limit, page } = parsePagination(searchParams);
  const search = searchParams.get("search") ?? "";
  const nicheId = searchParams.get("nicheId") ?? undefined;
  const isActive = searchParams.get("isActive");

  const where = {
    ...(search && {
      OR: [
        { businessName: { contains: search } },
        { user: { email: { contains: search } } },
      ],
    }),
    ...(nicheId && { nicheId }),
    ...(isActive !== null && { isActive: isActive === "true" }),
  };

  const [clients, total] = await prisma.$transaction([
    prisma.client.findMany({ where, select: clientSelect, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.client.count({ where }),
  ]);

  return { clients, total, page, limit };
}

// ─── Get single client ────────────────────────────────────────────────────────

export async function getClient(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: clientSelect,
  });
  if (!client) throw new ApiError(404, "Client not found");
  return client;
}

// ─── Get client dashboard summary (Admin view) ────────────────────────────────

export async function getClientDashboard(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      ...clientSelect,
      monthlyBatches: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 6,
        select: {
          id: true,
          month: true,
          year: true,
          status: true,
          publishedAt: true,
          dueDate: true,
          _count: { select: { contentItems: true } },
        },
      },
    },
  });
  if (!client) throw new ApiError(404, "Client not found");

  // Approval stats for the current/latest batch
  const latestBatch = client.monthlyBatches[0];
  let approvalStats = null;
  if (latestBatch) {
    const counts = await prisma.monthlyContentItem.groupBy({
      by: ["approvalStatus"],
      where: { batchId: latestBatch.id },
      _count: true,
    });
    approvalStats = Object.fromEntries(counts.map((c) => [c.approvalStatus, c._count]));
  }

  const openDesignRequests = await prisma.designRequest.count({
    where: { clientId, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });

  return { client, approvalStats, openDesignRequests };
}

// ─── Create client ────────────────────────────────────────────────────────────

export async function createClient(input: CreateClientInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  const nicheExists = await prisma.niche.findUnique({ where: { id: input.nicheId } });
  if (!nicheExists) throw new ApiError(404, "Niche not found");

  const packageExists = await prisma.package.findUnique({ where: { id: input.packageId } });
  if (!packageExists) throw new ApiError(404, "Package not found");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const slug = await generateUniqueSlug(input.businessName);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "CLIENT",
      },
    });

    const client = await tx.client.create({
      data: {
        userId: user.id,
        nicheId: input.nicheId,
        packageId: input.packageId,
        businessName: input.businessName,
        slug,
        tagline: input.tagline,
        website: input.website,
        phone: input.phone,
        address: input.address,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        onboardedAt: new Date(),
      },
      select: clientSelect,
    });

    return client;
  });
}

// ─── Update client ────────────────────────────────────────────────────────────

export async function updateClient(clientId: string, input: UpdateClientInput) {
  await getClient(clientId); // throws 404 if not found

  return prisma.client.update({
    where: { id: clientId },
    data: {
      ...(input.businessName && { businessName: input.businessName }),
      ...(input.nicheId && { nicheId: input.nicheId }),
      ...(input.packageId && { packageId: input.packageId }),
      ...(input.tagline !== undefined && { tagline: input.tagline }),
      ...(input.website !== undefined && { website: input.website }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.primaryColor !== undefined && { primaryColor: input.primaryColor }),
      ...(input.secondaryColor !== undefined && { secondaryColor: input.secondaryColor }),
    },
    select: clientSelect,
  });
}

// ─── Toggle active ────────────────────────────────────────────────────────────

export async function setClientActive(clientId: string, isActive: boolean) {
  await getClient(clientId);
  return prisma.$transaction([
    prisma.client.update({ where: { id: clientId }, data: { isActive } }),
    prisma.user.update({
      where: { client: { id: clientId } },
      data: { isActive },
    }),
  ]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  while (await prisma.client.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}
