"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface ApprovalItem {
  id: string; approvalStatus: string; updatedAt: string;
  approval: { approvedAt: string | null; revisionNote: string | null } | null;
  template: { name: string; contentType: string; thumbnailUrl: string | null };
  batch: { month: number; year: number };
}

export default function ApprovalsPage() {
  const { data, isLoading } = useSWR("/api/client/approvals", fetcher);
  const items: ApprovalItem[] = data?.data ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Approvals" description="History of all your content decisions" />

      <div className="p-8">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No approval history yet"
            description="Approvals and revision requests will appear here once you review your content."
          />
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/client/content/${item.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                >
                  {/* Thumbnail */}
                  {item.template.thumbnailUrl ? (
                    <div className="size-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                      <img src={item.template.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="size-14 rounded-lg bg-muted shrink-0 flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {item.template.contentType[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {MONTHS[item.batch.month - 1]} {item.batch.year}
                    </p>
                    {item.approval?.revisionNote && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                        "{item.approval.revisionNote}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={item.approvalStatus as never} />
                    <p className="text-[11px] text-muted-foreground">
                      {item.approval?.approvedAt
                        ? new Date(item.approval.approvedAt).toLocaleDateString()
                        : new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
