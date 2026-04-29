"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3, Filter, CheckCircle2, Clock, AlertCircle, Play,
  Check, RotateCcw, Palette, Edit3,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MediaPreview } from "@/components/shared/MediaPreview";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/cn";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PLATFORMS = [
  { slug: "ALL", label: "All" },
  { slug: "FACEBOOK", label: "Facebook" },
  { slug: "INSTAGRAM", label: "Instagram" },
  { slug: "LINKEDIN", label: "LinkedIn" },
  { slug: "TIKTOK", label: "TikTok" },
  { slug: "GOOGLE_MY_BUSINESS", label: "Google" },
  { slug: "TWITTER_X", label: "X" },
];

interface ContentItem {
  id: string; tagline: string | null; caption: string | null; cta: string | null;
  approvalStatus: string; isLocked: boolean;
  template: { name: string; contentType: string; thumbnailUrl: string | null; media: { secureUrl: string; format: string; resourceType: string } | null };
  platforms: { platform: { slug: string; name: string } }[];
  approval: { status: string; approvedAt: string | null } | null;
}

function ContentCard({ item, onApprove }: { item: ContentItem; onApprove: (id: string) => void }) {
  const { toast } = useToast();
  const [approving, setApproving] = useState(false);

  const isApproved = item.approvalStatus === "APPROVED";
  const isRevision = item.approvalStatus === "REVISION_REQUESTED";

  async function handleApprove(e: React.MouseEvent) {
    e.preventDefault();
    setApproving(true);
    const res = await fetch(`/api/client/content/${item.id}/approve`, { method: "POST" });
    setApproving(false);
    if (res.ok) { onApprove(item.id); toast({ variant: "success", title: "Content approved!" }); }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "group relative rounded-2xl border bg-card overflow-hidden transition-shadow hover:shadow-lg",
        isApproved && "ring-2 ring-emerald-500/30",
        isRevision && "ring-2 ring-red-500/30",
      )}
    >
      {/* Media */}
      <div className="relative">
        <Link href={`/client/content/${item.id}`}>
          <MediaPreview
            url={item.template.media?.secureUrl ?? item.template.thumbnailUrl}
            format={item.template.media?.format}
            resourceType={item.template.media?.resourceType}
            alt={item.template.name}
            aspectRatio="square"
            className="rounded-none"
          />
        </Link>

        {/* Status overlay */}
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge status={item.approvalStatus as never} />
        </div>

        {/* Approved checkmark */}
        <AnimatePresence>
          {isApproved && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2.5 right-2.5 size-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md"
            >
              <Check className="size-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-sm font-semibold leading-tight line-clamp-1">{item.template.name}</p>
          <Badge variant="muted" className="text-[10px] mt-1">{item.template.contentType}</Badge>
        </div>

        {(item.tagline ?? item.template.thumbnailUrl) && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.tagline}</p>
        )}

        {/* Platform icons */}
        {item.platforms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.platforms.slice(0, 4).map((p) => (
              <span key={p.platform.slug} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                {p.platform.slug.split("_")[0]}
              </span>
            ))}
            {item.platforms.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{item.platforms.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isApproved && (
        <div className="px-3 pb-3 flex gap-2">
          <Button
            className="flex-1 h-8 text-xs"
            variant="success"
            onClick={handleApprove}
            loading={approving}
            disabled={item.isLocked}
          >
            <Check className="size-3" /> Approve
          </Button>
          <Button variant="outline" size="icon-sm" asChild>
            <Link href={`/client/content/${item.id}`}>
              <Edit3 className="size-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default function ContentPage() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const key = `/api/client/content?${platform !== "ALL" ? `platform=${platform}&` : ""}${statusFilter !== "ALL" ? `approvalStatus=${statusFilter}` : ""}`;
  const { data, isLoading, mutate: revalidate } = useSWR(key, fetcher);

  const batch = data?.data?.batch;
  const items: ContentItem[] = data?.data?.items ?? [];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Content"
        description={batch ? `${MONTHS[batch.month - 1]} ${batch.year} batch` : "Your latest content batch"}
      />

      <div className="p-8 space-y-4">
        {/* Platform filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          {PLATFORMS.map((p) => (
            <button
              key={p.slug}
              onClick={() => setPlatform(p.slug)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                platform === p.slug
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50",
              )}
            >
              {p.label}
            </button>
          ))}

          <div className="ml-auto">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="h-8">
                <TabsTrigger value="ALL" className="text-xs h-6">All</TabsTrigger>
                <TabsTrigger value="PENDING" className="text-xs h-6">Pending</TabsTrigger>
                <TabsTrigger value="APPROVED" className="text-xs h-6">Approved</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : !batch ? (
          <EmptyState
            icon={Grid3X3}
            title="No content batch yet"
            description="Your monthly content will appear here once your account manager publishes it."
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No items match this filter"
            description="Try a different platform or status filter."
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  onApprove={() => revalidate()}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
