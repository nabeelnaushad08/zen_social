import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ApiError } from "@/lib/errors";
import type { z } from "zod";
import type { CreateNicheSchema, UpdateNicheSchema } from "@/lib/validations/admin";

type CreateNicheInput = z.infer<typeof CreateNicheSchema>;
type UpdateNicheInput = z.infer<typeof UpdateNicheSchema>;

export async function listNiches(includeInactive = false) {
  return prisma.niche.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { clients: true, contentTemplates: true } },
    },
  });
}

export async function getNiche(nicheId: string) {
  const niche = await prisma.niche.findUnique({
    where: { id: nicheId },
    include: {
      packages: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      _count: { select: { clients: true, contentTemplates: true } },
    },
  });
  if (!niche) throw new ApiError(404, "Niche not found");
  return niche;
}

export async function createNiche(input: CreateNicheInput) {
  const slug = slugify(input.name);
  return prisma.niche.create({
    data: { ...input, slug },
  });
}

export async function updateNiche(nicheId: string, input: UpdateNicheInput) {
  await getNiche(nicheId);
  const slug = input.name ? slugify(input.name) : undefined;
  return prisma.niche.update({
    where: { id: nicheId },
    data: { ...input, ...(slug && { slug }) },
  });
}

export async function toggleNicheActive(nicheId: string, isActive: boolean) {
  await getNiche(nicheId);
  return prisma.niche.update({ where: { id: nicheId }, data: { isActive } });
}
