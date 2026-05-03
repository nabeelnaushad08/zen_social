import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  link: z.string().optional().nullable(),
  linkLabel: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clientId: string; taskId: string } },
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = UpdateTaskSchema.parse(body);
    const task = await prisma.clientTask.update({
      where: { id: params.taskId },
      data: {
        ...(input.title && { title: input.title }),
        ...("description" in input && { description: input.description ?? null }),
        ...(input.status && { status: input.status }),
        ...("link" in input && { link: input.link ?? null }),
        ...("linkLabel" in input && { linkLabel: input.linkLabel ?? null }),
        ...("dueDate" in input && { dueDate: input.dueDate ? new Date(input.dueDate) : null }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });
    return NextResponse.json(ok(task));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clientId: string; taskId: string } },
) {
  try {
    await requireAdmin();
    await prisma.clientTask.delete({ where: { id: params.taskId } });
    return NextResponse.json(ok({ success: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
