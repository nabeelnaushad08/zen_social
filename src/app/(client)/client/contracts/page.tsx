"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { FileText, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Contract {
  id: string; title: string; status: string; startDate: string;
  endDate: string | null; documentUrl: string | null; notes: string | null; createdAt: string;
}

function statusColor(s: string) {
  if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700";
  if (s === "EXPIRED") return "bg-gray-100 text-gray-600";
  if (s === "CANCELLED") return "bg-red-100 text-red-600";
  return "bg-amber-100 text-amber-700";
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ContractsPage() {
  const { data, isLoading } = useSWR("/api/client/contracts", fetcher);
  const contracts: Contract[] = data?.data ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Contracts" description="Your agreements and timelines" />

      <div className="p-8 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : contracts.length === 0 ? (
          <EmptyState icon={FileText} title="No contracts" description="Your contracts will appear here when added by your account manager." />
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => {
              const days = daysUntil(c.endDate);
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{c.title}</p>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusColor(c.status)}`}>{c.status}</span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Start: {new Date(c.startDate).toLocaleDateString()}
                        {c.endDate && <> · End: {new Date(c.endDate).toLocaleDateString()}</>}
                      </p>

                      {days !== null && (
                        <div className={`inline-flex items-center text-sm font-semibold ${days < 0 ? "text-red-600" : days < 30 ? "text-amber-600" : "text-emerald-600"}`}>
                          {days < 0
                            ? `⚠ Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`
                            : `✓ ${days} day${days !== 1 ? "s" : ""} remaining`
                          }
                        </div>
                      )}

                      {c.notes && <p className="text-sm text-muted-foreground">{c.notes}</p>}

                      {c.documentUrl && (
                        <a
                          href={c.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                        >
                          <ExternalLink className="size-4" /> View contract document
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
