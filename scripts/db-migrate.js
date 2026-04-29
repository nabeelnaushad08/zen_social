#!/usr/bin/env node
/**
 * Runs `prisma migrate deploy` then `prisma db seed` when DATABASE_URL is set.
 * Both steps are idempotent: migrate deploy only applies pending migrations,
 * and the seed uses upsert with update:{} so it never overwrites existing data.
 */
const { execSync } = require("child_process");

if (!process.env.DATABASE_URL) {
  console.warn("⚠  DATABASE_URL not found — skipping migrate + seed");
  console.warn("   Set DATABASE_URL in Vercel → Settings → Environment Variables");
  process.exit(0);
}

// ── 1. Migrations ────────────────────────────────────────────────────────────
console.log("🗄  Running prisma migrate deploy…");
try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("✅  Migrations applied");
} catch (err) {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
}

// ── 2. Seed (platforms + admin user) ─────────────────────────────────────────
console.log("🌱  Running prisma db seed…");
try {
  execSync("npx prisma db seed", { stdio: "inherit" });
  console.log("✅  Seed complete");
} catch (err) {
  // Non-fatal — seed failure should not block a deploy
  console.warn("⚠  Seed failed (non-fatal):", err.message);
}
