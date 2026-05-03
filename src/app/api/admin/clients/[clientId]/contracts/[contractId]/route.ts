import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

const UpdateContractSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clientId: string; contractId: string } },
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = UpdateContractSchema.parse(body);
    const contract = await prisma.contract.update({
      where: { id: params.contractId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.status && { status: input.status }),
        ...(input.startDate && { startDate: new Date(input.startDate) }),
        ...("endDate" in input && { endDate: input.endDate ? new Date(input.endDate) : null }),
        ...("documentUrl" in input && { documentUrl: input.documentUrl ?? null }),
        ...("notes" in input && { notes: input.notes ?? null }),
      },
    });
    return NextResponse.json(ok(contract));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clientId: string; contractId: string } },
) {
  try {
    await requireAdmin();
    await prisma.contract.delete({ where: { id: params.contractId } });
    return NextResponse.json(ok({ success: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
