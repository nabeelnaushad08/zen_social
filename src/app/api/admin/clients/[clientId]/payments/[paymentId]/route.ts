import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { ok } from "@/lib/utils";

export const dynamic = "force-dynamic";

const UpdatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  status: z.enum(["PAID", "UNPAID", "OVERDUE", "CANCELLED"]).optional(),
  dueDate: z.string().optional(),
  paidAt: z.string().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clientId: string; paymentId: string } },
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = UpdatePaymentSchema.parse(body);
    const payment = await prisma.payment.update({
      where: { id: params.paymentId },
      data: {
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.currency && { currency: input.currency }),
        ...(input.status && { status: input.status }),
        ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
        ...("paidAt" in input && { paidAt: input.paidAt ? new Date(input.paidAt) : null }),
        ...("invoiceUrl" in input && { invoiceUrl: input.invoiceUrl ?? null }),
        ...("description" in input && { description: input.description ?? null }),
      },
    });
    return NextResponse.json(ok(payment));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clientId: string; paymentId: string } },
) {
  try {
    await requireAdmin();
    await prisma.payment.delete({ where: { id: params.paymentId } });
    return NextResponse.json(ok({ success: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
