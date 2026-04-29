// prisma/seed.ts
// Seeds: all 11 platforms, sample niche, starter package, admin user, test client user.
// All operations use upsert — safe to run on every deploy.

import { PrismaClient, PlatformSlug } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Platforms ──────────────────────────────────────────────────────────────
  const platforms: { slug: PlatformSlug; name: string; aspectRatio: string; sortOrder: number }[] = [
    { slug: "FACEBOOK",           name: "Facebook",           aspectRatio: "1.91:1", sortOrder: 1  },
    { slug: "INSTAGRAM",          name: "Instagram",          aspectRatio: "1:1",    sortOrder: 2  },
    { slug: "LINKEDIN",           name: "LinkedIn",           aspectRatio: "1.91:1", sortOrder: 3  },
    { slug: "GOOGLE_MY_BUSINESS", name: "Google My Business", aspectRatio: "4:3",    sortOrder: 4  },
    { slug: "TWITTER_X",          name: "Twitter / X",        aspectRatio: "16:9",   sortOrder: 5  },
    { slug: "PINTEREST",          name: "Pinterest",          aspectRatio: "2:3",    sortOrder: 6  },
    { slug: "TIKTOK",             name: "TikTok",             aspectRatio: "9:16",   sortOrder: 7  },
    { slug: "YOUTUBE",            name: "YouTube",            aspectRatio: "16:9",   sortOrder: 8  },
    { slug: "TRIPADVISOR",        name: "TripAdvisor",        aspectRatio: "16:9",   sortOrder: 9  },
    { slug: "LINKTREE",           name: "Linktree",           aspectRatio: "1:1",    sortOrder: 10 },
    { slug: "BLUESKY",            name: "Bluesky",            aspectRatio: "1.91:1", sortOrder: 11 },
  ];

  for (const p of platforms) {
    await prisma.platform.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  console.log("  ✓ Platforms");

  // ── Sample Niche ───────────────────────────────────────────────────────────
  const niche = await prisma.niche.upsert({
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
  console.log("  ✓ Niche");

  // ── Starter Package ────────────────────────────────────────────────────────
  const pkg = await prisma.package.upsert({
    where: { slug: "dental-starter" },
    update: {},
    create: {
      nicheId: niche.id,
      name: "Dental Starter",
      slug: "dental-starter",
      description: "Entry-level dental social media package",
      monthlyPostLimit: 20,
      price: 299,
      isActive: true,
      sortOrder: 1,
      packageCategories: {
        create: [
          { name: "Promotional Banners", contentType: "BANNER",   monthlyLimit: 8,  sortOrder: 1 },
          { name: "Educational Reels",   contentType: "REEL",     monthlyLimit: 4,  sortOrder: 2 },
          { name: "Stories",             contentType: "STORY",    monthlyLimit: 4,  sortOrder: 3 },
          { name: "Social Proof",        contentType: "SOCIAL_PROOF", monthlyLimit: 4, sortOrder: 4 },
        ],
      },
    },
  });
  console.log("  ✓ Package");

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    ?? process.env.SEED_ADMIN_EMAIL    ?? "admin@zensocial.io";
  const adminPassword = process.env.ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
  const adminFirst    = process.env.ADMIN_FIRST_NAME ?? "Admin";
  const adminLast     = process.env.ADMIN_LAST_NAME  ?? "ZenSocial";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await hash(adminPassword, 12),
      role: "ADMIN",
      firstName: adminFirst,
      lastName: adminLast,
      isActive: true,
    },
  });
  console.log("  ✓ Admin user →", adminEmail);

  // ── Test Client User ───────────────────────────────────────────────────────
  const clientEmail    = "client@zensocial.io";
  const clientPassword = "Client@12345";

  const clientUser = await prisma.user.upsert({
    where: { email: clientEmail },
    update: {},
    create: {
      email: clientEmail,
      passwordHash: await hash(clientPassword, 12),
      role: "CLIENT",
      firstName: "Jane",
      lastName: "Demo",
      isActive: true,
    },
  });

  // Create the Client profile linked to the user (only if it doesn't exist yet)
  const existingClient = await prisma.client.findUnique({ where: { userId: clientUser.id } });
  if (!existingClient) {
    await prisma.client.create({
      data: {
        userId:       clientUser.id,
        nicheId:      niche.id,
        packageId:    pkg.id,
        businessName: "Demo Dental Clinic",
        slug:         "demo-dental-clinic",
        tagline:      "Your smile is our priority",
        isActive:     true,
        onboardedAt:  new Date(),
      },
    });
  }
  console.log("  ✓ Client user →", clientEmail);

  console.log("\n✅  Seed complete.\n");
  console.log("  Admin  →  " + adminEmail     + "  /  " + adminPassword);
  console.log("  Client →  " + clientEmail    + "  /  " + clientPassword);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
