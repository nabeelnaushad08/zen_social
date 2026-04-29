"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { Palette, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useState } from "react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface DesignRequest {
  id: string; status: string; comment: string; adminNote: string | null;
  createdAt: string; updatedAt: string;
  contentItem: { template: { name: string; contentType: string }; batch: { month: number; year: number } };
  assets: { media: { secureUrl: string; format: string } }[];
}

export default function DesignRequestsPage() {
  const [tab, setTab] = useState("ALL");

  const key = `/api/client/design-requests${tab !== "ALL" ? `?status=${tab}` : ""}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const requests: DesignRequest[] = data?.data ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Design Requests"
        description="Track your design change requests"
      />

      <div className="p-8 space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs">
                {s === "ALL" ? "All" : s.replace("_", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Palette}
            title="No design requests"
            description="Submit design change requests from the content detail page when you'd like a design modified."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-xl border bg-card space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{req.contentItem.template.name}</p>
                      <Badge variant="muted" className="text-[10px]">{req.contentItem.template.contentType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {MONTHS[req.contentItem.batch.month - 1]} {req.contentItem.batch.year}
                    </p>
                  </div>
                  <StatusBadge status={req.status as never} />
                </div>

                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Your request</p>
                  <p className="text-sm line-clamp-3">{req.comment}</p>
                </div>

                {req.adminNote && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                    <p className="text-xs text-primary font-medium mb-0.5">Team response</p>
                    <p className="text-sm">{req.adminNote}</p>
                  </div>
                )}

                {req.assets.length > 0 && (
                  <div className="flex gap-2">
                    {req.assets.map((a, ai) => (
                      <a key={ai} href={a.media.secureUrl} target="_blank" rel="noopener noreferrer">
                        <div className="size-12 rounded-lg overflow-hidden bg-muted border">
                          <img src={a.media.secureUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Submitted {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
