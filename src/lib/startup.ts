/**
 * Auto-seed guard — runs once per cold-start.
 * Checks whether the Platform table has been seeded and, if not, seeds it.
 * This handles the case where the Vercel build ran `prisma migrate deploy`
 * (which creates tables) but the seed step was skipped or failed.
 *
 * Import and await this at the top of any long-lived server module,
 * or call it from the health-check route on first boot.
 */

import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { PlatformSlug } from "@prisma/client";

let seeded = false;

const PLATFORMS: { slug: PlatformSlug; name: string; aspectRatio: string; sortOrder: number }[] = [
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

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;

  try {
    const platformCount = await prisma.platform.count();

    if (platformCount === 0) {
      console.log("[startup] Seeding platforms and admin user…");

      // Seed all 11 platforms
      for (const p of PLATFORMS) {
        await prisma.platform.upsert({
          where: { slug: p.slug },
          update: {},
          create: p,
        });
      }

      // Seed admin user
      const adminEmail = process.env.ADMIN_EMAIL ?? "admin@zensocial.io";
      const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
      const adminFirstName = process.env.ADMIN_FIRST_NAME ?? "Admin";
      const adminLastName = process.env.ADMIN_LAST_NAME ?? "ZenSocial";

      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
          email: adminEmail,
          passwordHash: await hash(adminPassword, 12),
          role: "ADMIN",
          firstName: adminFirstName,
          lastName: adminLastName,
          isActive: true,
        },
      });

      console.log("[startup] Seed complete.");
    }

    seeded = true;
  } catch (err) {
    // Non-fatal — log and continue; the app should still serve requests
    console.error("[startup] Auto-seed failed:", err);
  }
}
