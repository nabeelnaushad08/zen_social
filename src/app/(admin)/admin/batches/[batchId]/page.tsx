"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Play, Trash2, GripVertical,
  CheckCircle2, Clock, AlertCircle, Image as ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MediaPreview } from "@/components/shared/MediaPreview";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BatchItem {
  id: string;
  sortOrder: number;
  tagline: string | null;
  caption: string | null;
  cta: string | null;
  approvalStatus: string;
  isLocked: boolean;
  template: {
    id: string;
    name: string;
    contentType: string;
    thumbnailUrl: string | null;
    media: { secureUrl: string; format: string; resourceType: string } | null;
  };
  platforms: { platform: { slug: string; name: string } }[];
  approval: { status: string; revisionNote: string | null } | null;
}

interface BatchDetail {
  id: string;
  month: number;
  year: number;
  status: string;
  publishedAt: string | null;
  dueDate: string | null;
  notes: string | null;
  client: { id: string; businessName: string; slug: string; niche: { name: string } | null };
  contentItems: BatchItem[];
}

interface Template {
  id: string;
  name: string;
  contentType: string;
  thumbnailUrl: string | null;
  status: string;
  niche: { name: string } | null;
}

// ─── Item Card ─────────────────────────────────────────────────────────────────

function ApprovalIcon({ status }: { status: string }) {
  if (status === "APPROVED") return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (status === "REVISION_REQUESTED") return <AlertCircle className="size-4 text-red-500" />;
  return <Clock className="size-4 text-amber-500" />;
}

function BatchItemCard({ item, batchId, onRemove }: {
  item: BatchItem;
  batchId: string;
  onRemove: () => void;
}) {
  const { toast } = useToast();
  const thumbUrl = item.template.thumbnailUrl ?? item.template.media?.secureUrl ?? null;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          <div className="w-24 shrink-0 bg-muted relative">
            <MediaPreview
              url={thumbUrl}
              format={item.template.media?.format}
              resourceType={item.template.media?.resourceType}
              aspectRatio="square"
              className="rounded-none"
            />
          </div>
          <CardContent className="p-3 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{item.template.name}</p>
                <p className="text-xs text-muted-foreground">{item.template.contentType}</p>
                {item.platforms.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.platforms.map((p) => p.platform.name).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ApprovalIcon status={item.approvalStatus} />
                <Button variant="ghost" size="icon-sm" onClick={onRemove}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
            {item.approval?.revisionNote && (
              <p className="mt-1 text-xs text-red-600 bg-red-50 rounded p-1.5 line-clamp-2">
                Revision: {item.approval.revisionNote}
              </p>
            )}
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BatchDetailPage() {
  const params = useParams<{ batchId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const batchId = params.batchId;

  const key = `/api/admin/batches/${batchId}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const batch: BatchDetail | null = data?.data ?? null;

  const [showAddItem, setShowAddItem] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");

  const { data: templatesData } = useSWR(
    showAddItem ? `/api/admin/templates?status=PUBLISHED&search=${encodeURIComponent(templateSearch)}&limit=20` : null,
    fetcher,
  );
  const templates: Template[] = templatesData?.data ?? [];

  async function handleAddItem() {
    if (!selectedTemplate) return;
    setAddingItem(true);
    const res = await fetch(`/api/admin/batches/${batchId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: selectedTemplate }),
    });
    setAddingItem(false);
    if (res.ok) {
      globalMutate(key);
      setShowAddItem(false);
      setSelectedTemplate("");
      toast({ variant: "success", title: "Item added to batch" });
    } else {
      const err = await res.json();
      toast({ variant: "destructive", title: err.error ?? "Failed to add item" });
    }
  }

  async function handleRemoveItem(itemId: string) {
    const res = await fetch(`/api/admin/batches/${batchId}/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      globalMutate(key);
      toast({ title: "Item removed" });
    }
  }

  async function handlePublish() {
    setPublishing(true);
    const res = await fetch(`/api/admin/batches/${batchId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sendNotification: true }),
    });
    setPublishing(false);
    if (res.ok) {
      globalMutate(key);
      setShowPublish(false);
      toast({ variant: "success", title: "Batch published — client notified" });
    } else {
      const err = await res.json();
      toast({ variant: "destructive", title: err.error ?? "Failed to publish" });
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Batch not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const approved = batch.contentItems.filter((i) => i.approvalStatus === "APPROVED").length;
  const pending = batch.contentItems.filter((i) => i.approvalStatus === "PENDING").length;
  const revision = batch.contentItems.filter((i) => i.approvalStatus === "REVISION_REQUESTED").length;
  const total = batch.contentItems.length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${MONTHS[batch.month - 1]} ${batch.year} — ${batch.client.businessName}`}
        description={[
          batch.client.niche?.name,
          `${total} item${total !== 1 ? "s" : ""}`,
          batch.dueDate ? `Due ${new Date(batch.dueDate).toLocaleDateString()}` : null,
        ].filter(Boolean).join(" · ")}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {batch.status === "DRAFT" && (
              <>
                <Button size="sm" variant="outline" onClick={() => setShowAddItem(true)}>
                  <Plus className="size-4" /> Add item
                </Button>
                <Button size="sm" onClick={() => setShowPublish(true)} disabled={total === 0}>
                  <Play className="size-4" /> Publish
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* Status bar */}
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
          <StatusBadge status={batch.status as never} />
          {total > 0 && (
            <div className="flex items-center gap-4 text-sm">
              {approved > 0 && <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="size-4" />{approved} approved</span>}
              {pending > 0 && <span className="flex items-center gap-1.5 text-amber-600"><Clock className="size-4" />{pending} pending</span>}
              {revision > 0 && <span className="flex items-center gap-1.5 text-red-600"><AlertCircle className="size-4" />{revision} needs revision</span>}
            </div>
          )}
          {batch.publishedAt && (
            <span className="text-xs text-muted-foreground ml-auto">
              Published {new Date(batch.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Content items grid */}
        {total === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <ImageIcon className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No content items yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add published templates to build this batch.</p>
            {batch.status === "DRAFT" && (
              <Button className="mt-4" onClick={() => setShowAddItem(true)}>
                <Plus className="size-4" /> Add first item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batch.contentItems.map((item) => (
              <BatchItemCard
                key={item.id}
                item={item}
                batchId={batchId}
                onRemove={() => handleRemoveItem(item.id)}
              />
            ))}
            {batch.status === "DRAFT" && (
              <button
                onClick={() => setShowAddItem(true)}
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="size-6" />
                <span className="text-sm font-medium">Add item</span>
              </button>
            )}
          </div>
        )}

        {batch.notes && (
          <div className="p-4 rounded-xl bg-muted/50 text-sm">
            <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
            <p>{batch.notes}</p>
          </div>
        )}
      </div>

      {/* Add item modal */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add content item</DialogTitle>
            <DialogDescription>Select a published template to add to this batch.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 mt-2">
            <input
              type="text"
              placeholder="Search templates…"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="grid grid-cols-3 gap-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id === selectedTemplate ? "" : t.id)}
                  className={`rounded-xl border-2 p-2 text-left transition-all ${selectedTemplate === t.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:border-muted-foreground/30"}`}
                >
                  <MediaPreview url={t.thumbnailUrl} alt={t.name} aspectRatio="square" className="rounded-lg mb-1.5" />
                  <p className="text-xs font-medium truncate">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.contentType}</p>
                </button>
              ))}
            </div>
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No published templates found.</p>
            )}
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowAddItem(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={!selectedTemplate || addingItem} loading={addingItem}>
              Add to batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish confirmation */}
      <Dialog open={showPublish} onOpenChange={setShowPublish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish batch</DialogTitle>
            <DialogDescription>
              This will make {total} item{total !== 1 ? "s" : ""} visible to the client and send them a notification. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublish(false)}>Cancel</Button>
            <Button onClick={handlePublish} loading={publishing}>
              <Play className="size-4" /> Publish now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
