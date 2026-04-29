#!/usr/bin/env node
/**
 * Runs `prisma migrate deploy` only when DATABASE_URL is available.
 * This makes Vercel builds safe even if env vars aren't wired yet,
 * while still running migrations on every real production deploy.
 */
const { execSync } = require("child_process");

if (!process.env.DATABASE_URL) {
  console.warn("⚠  DATABASE_URL not found — skipping prisma migrate deploy");
  console.warn("   Set DATABASE_URL in Vercel → Settings → Environment Variables");
  process.exit(0);
}

console.log("🗄  Running prisma migrate deploy…");
try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("✅  Migrations applied");
} catch (err) {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
}
