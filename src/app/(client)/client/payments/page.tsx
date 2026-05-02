"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { CreditCard, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Payment {
  id: string; amount: string; currency: string; status: string;
  dueDate: string; paidAt: string | null; invoiceUrl: string | null;
  description: string | null; createdAt: string;
}

function statusColor(s: string) {
  if (s === "PAID") return "bg-emerald-100 text-emerald-700";
  if (s === "OVERDUE") return "bg-red-100 text-red-600";
  if (s === "CANCELLED") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-700";
}

export default function PaymentsPage() {
  const { data, isLoading } = useSWR("/api/client/payments", fetcher);
  const payments: Payment[] = data?.data ?? [];

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalOutstanding = payments.filter((p) => p.status === "UNPAID" || p.status === "OVERDUE").reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Payments" description="Your payment history and upcoming dues" />

      <div className="p-8 space-y-6">
        {/* Summary */}
        {payments.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total paid</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">${totalPaid.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding</p>
                <p className={`text-2xl font-bold mt-1 ${totalOutstanding > 0 ? "text-amber-600" : "text-muted-foreground"}`}>${totalOutstanding.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment records" description="Your payment history will appear here." />
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{p.currency} {parseFloat(p.amount).toFixed(2)}</p>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusColor(p.status)}`}>{p.status}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Due {new Date(p.dueDate).toLocaleDateString()}
                        {p.paidAt && <> · Paid {new Date(p.paidAt).toLocaleDateString()}</>}
                        {p.description && <> · {p.description}</>}
                      </p>
                    </div>
                    {p.invoiceUrl && (
                      <a
                        href={p.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0"
                      >
                        <ExternalLink className="size-4" /> Invoice
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
