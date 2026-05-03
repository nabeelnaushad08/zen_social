import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
  link: z.string().optional().nullable(),
  linkLabel: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  try {
    await requireAdmin();
    const tasks = await prisma.clientTask.findMany({
      where: { clientId: params.clientId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(ok(tasks));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = CreateTaskSchema.parse(body);
    const task = await prisma.clientTask.create({
      data: {
        clientId: params.clientId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        link: input.link ?? null,
        linkLabel: input.linkLabel ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        sortOrder: input.sortOrder,
      },
    });
    return NextResponse.json(ok(task), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
