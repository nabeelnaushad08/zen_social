import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ApiError } from "@/lib/errors";
import type { z } from "zod";
import type { CreatePackageSchema, UpdatePackageSchema } from "@/lib/validations/admin";

type CreatePackageInput = z.infer<typeof CreatePackageSchema>;
type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;

const packageSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  monthlyPostLimit: true,
  price: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  niche: { select: { id: true, name: true, slug: true } },
  packageCategories: { orderBy: { sortOrder: "asc" as const } },
  _count: { select: { clients: true } },
} as const;

export async function listPackages(nicheId?: string) {
  return prisma.package.findMany({
    where: { ...(nicheId && { nicheId }), isActive: true },
    select: packageSelect,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getPackage(packageId: string) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    select: packageSelect,
  });
  if (!pkg) throw new ApiError(404, "Package not found");
  return pkg;
}

export async function createPackage(input: CreatePackageInput) {
  const { categories, ...packageData } = input;
  const slug = await generateUniqueSlug(input.name);

  return prisma.package.create({
    data: {
      ...packageData,
      slug,
      price: input.price,
      packageCategories: {
        create: categories.map((cat) => ({
          name: cat.name,
          contentType: cat.contentType,
          monthlyLimit: cat.monthlyLimit,
          sortOrder: cat.sortOrder,
        })),
      },
    },
    select: packageSelect,
  });
}

export async function updatePackage(packageId: string, input: UpdatePackageInput) {
  await getPackage(packageId);
  const slug = input.name ? await generateUniqueSlug(input.name, packageId) : undefined;
  return prisma.package.update({
    where: { id: packageId },
    data: {
      ...input,
      price: input.price,
      ...(slug && { slug }),
    },
    select: packageSelect,
  });
}

export async function togglePackageActive(packageId: string, isActive: boolean) {
  await getPackage(packageId);
  return prisma.package.update({ where: { id: packageId }, data: { isActive } });
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  while (
    await prisma.package.findFirst({
      where: { slug, ...(excludeId && { id: { not: excludeId } }) },
    })
  ) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}
