import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { ok } from "@/lib/utils";

const CreateContractSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"]).default("ACTIVE"),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  try {
    await requireAdmin();
    const contracts = await prisma.contract.findMany({
      where: { clientId: params.clientId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(ok(contracts));
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
    const input = CreateContractSchema.parse(body);
    const contract = await prisma.contract.create({
      data: {
        clientId: params.clientId,
        title: input.title,
        status: input.status,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        documentUrl: input.documentUrl ?? null,
        notes: input.notes ?? null,
      },
    });
    return NextResponse.json(ok(contract), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
