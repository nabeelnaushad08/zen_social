import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSeeded } from "@/lib/startup";

export const runtime = "nodejs";
// Revalidate every 30 s so Vercel doesn't cache a stale result
export const revalidate = 30;

export async function GET() {
  const start = Date.now();
  try {
    // Lightweight ping — reads a single row from a small table
    await prisma.$queryRaw`SELECT 1`;
    // On the very first boot, seed platforms + admin if tables are empty
    await ensureSeeded();
    return NextResponse.json(
      {
        status: "ok",
        db: "connected",
        latencyMs: Date.now() - start,
        ts: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[health] DB unreachable:", err);
    return NextResponse.json(
      {
        status: "error",
        db: "unreachable",
        latencyMs: Date.now() - start,
        ts: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
