"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { Plus, Calendar, Play, Archive, MoreHorizontal, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface BatchData {
  id: string; month: number; year: number; status: string; publishedAt: string | null;
  dueDate: string | null;
  client: { id: string; businessName: string; slug: string };
  _count: { contentItems: number };
}

function BatchCard({ batch, onPublish, onArchive }: { batch: BatchData; onPublish: (id: string) => void; onArchive: (id: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{batch.client.businessName}</p>
              <p className="text-xs text-muted-foreground">
                {MONTHS[batch.month - 1]} {batch.year}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={batch.status as never} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/batches/${batch.id}`}><ChevronRight className="size-4" /> Open batch</Link>
                  </DropdownMenuItem>
                  {batch.status === "DRAFT" && (
                    <DropdownMenuItem onClick={() => onPublish(batch.id)}>
                      <Play className="size-4" /> Publish
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {batch.status !== "ARCHIVED" && (
                    <DropdownMenuItem className="text-destructive" onClick={() => onArchive(batch.id)}>
                      <Archive className="size-4" /> Archive
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{batch._count.contentItems} items</span>
            {batch.dueDate && (
              <span>Due {new Date(batch.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function BatchesPage() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: "",
  });

  const key = "/api/admin/batches?limit=20";
  const { data, isLoading } = useSWR(key, fetcher);
  const { data: clientsData } = useSWR("/api/admin/clients?limit=100", fetcher);

  const batches: BatchData[] = data?.data ?? [];

  async function handlePublish(id: string) {
    const res = await fetch(`/api/admin/batches/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sendNotification: true }),
    });
    if (res.ok) { mutate(key); toast({ variant: "success", title: "Batch published — client notified" }); }
    else toast({ variant: "destructive", title: "Failed to publish batch" });
  }

  async function handleArchive(id: string) {
    await fetch(`/api/admin/batches/${id}`, { method: "DELETE" });
    mutate(key);
    toast({ title: "Batch archived" });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      const { data: batch } = await res.json();
      setShowCreate(false);
      mutate(key);
      toast({ variant: "success", title: "Batch created — add content items to it" });
    } else {
      const err = await res.json();
      toast({ variant: "destructive", title: err.error });
    }
  }

  // Group by status
  const draft = batches.filter((b) => b.status === "DRAFT");
  const published = batches.filter((b) => b.status === "PUBLISHED");
  const archived = batches.filter((b) => b.status === "ARCHIVED");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Monthly Engine"
        description="Create and publish monthly content batches for clients"
        action={
          <Button onClick={() => setShowCreate(true)}><Plus className="size-4" /> New batch</Button>
        }
      />

      <div className="p-8 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : batches.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No batches yet"
            description="Create your first batch and start adding monthly content for clients."
            action={<Button onClick={() => setShowCreate(true)}><Plus className="size-4" /> New batch</Button>}
          />
        ) : (
          <div className="space-y-6">
            {draft.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Draft ({draft.length})
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {draft.map((b) => <BatchCard key={b.id} batch={b} onPublish={handlePublish} onArchive={handleArchive} />)}
                </div>
              </section>
            )}
            {published.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Published ({published.length})
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {published.map((b) => <BatchCard key={b.id} batch={b} onPublish={handlePublish} onArchive={handleArchive} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create monthly batch</DialogTitle>
            <DialogDescription>Assign a client and period. You can add content items after creation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Select client</option>
                {(clientsData?.data ?? []).map((c: { id: string; businessName: string }) => (
                  <option key={c.id} value={c.id}>{c.businessName}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Month *</Label>
                <select required value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Year *</Label>
                <input type="number" required min={2024} max={2030} value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={creating}>Create batch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
