// prisma/seed.ts
// Seeds: all 11 platforms, a sample niche, and a default admin user.
// Run: npx prisma db seed

import { PrismaClient, PlatformSlug } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Platforms ──────────────────────────────────────────────────────────────
  const platforms: { slug: PlatformSlug; name: string; aspectRatio: string; sortOrder: number }[] = [
    { slug: "FACEBOOK",          name: "Facebook",          aspectRatio: "1.91:1", sortOrder: 1 },
    { slug: "INSTAGRAM",         name: "Instagram",         aspectRatio: "1:1",    sortOrder: 2 },
    { slug: "LINKEDIN",          name: "LinkedIn",          aspectRatio: "1.91:1", sortOrder: 3 },
    { slug: "GOOGLE_MY_BUSINESS",name: "Google My Business",aspectRatio: "4:3",    sortOrder: 4 },
    { slug: "TWITTER_X",         name: "Twitter / X",       aspectRatio: "16:9",   sortOrder: 5 },
    { slug: "PINTEREST",         name: "Pinterest",         aspectRatio: "2:3",    sortOrder: 6 },
    { slug: "TIKTOK",            name: "TikTok",            aspectRatio: "9:16",   sortOrder: 7 },
    { slug: "YOUTUBE",           name: "YouTube",           aspectRatio: "16:9",   sortOrder: 8 },
    { slug: "TRIPADVISOR",       name: "TripAdvisor",       aspectRatio: "16:9",   sortOrder: 9 },
    { slug: "LINKTREE",          name: "Linktree",          aspectRatio: "1:1",    sortOrder: 10 },
    { slug: "BLUESKY",           name: "Bluesky",           aspectRatio: "1.91:1", sortOrder: 11 },
  ];

  for (const p of platforms) {
    await prisma.platform.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // ── Sample Niche ───────────────────────────────────────────────────────────
  await prisma.niche.upsert({
    where: { slug: "dental" },
    update: {},
    create: {
      name: "Dental",
      slug: "dental",
      description: "Dental clinics and oral health practices",
      isActive: true,
      sortOrder: 1,
    },
  });

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@zensocial.io";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await hash(adminPassword, 12),
      role: "ADMIN",
      firstName: "Admin",
      lastName: "ZenSocial",
      isActive: true,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
