import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  status: z.enum(["PAID", "UNPAID", "OVERDUE", "CANCELLED"]).default("UNPAID"),
  dueDate: z.string(),
  paidAt: z.string().optional().nullable(),
  invoiceUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  try {
    await requireAdmin();
    const payments = await prisma.payment.findMany({
      where: { clientId: params.clientId },
      orderBy: { dueDate: "desc" },
    });
    return NextResponse.json(ok(payments));
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
    const input = CreatePaymentSchema.parse(body);
    const payment = await prisma.payment.create({
      data: {
        clientId: params.clientId,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        dueDate: new Date(input.dueDate),
        paidAt: input.paidAt ? new Date(input.paidAt) : null,
        invoiceUrl: input.invoiceUrl ?? null,
        description: input.description ?? null,
      },
    });
    return NextResponse.json(ok(payment), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
