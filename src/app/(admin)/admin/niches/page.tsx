"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { Plus, Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NichesPage() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", sortOrder: 0 });

  const key = "/api/admin/niches?includeInactive=true";
  const { data, isLoading } = useSWR(key, fetcher);
  const niches = data?.data ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/niches", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) { setShowCreate(false); mutate(key); toast({ variant: "success", title: "Niche created" }); }
    else { const err = await res.json(); toast({ variant: "destructive", title: err.error }); }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/niches/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }),
    });
    mutate(key);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Niches"
        description="Content categories for your client base"
        action={<Button onClick={() => setShowCreate(true)}><Plus className="size-4" /> New niche</Button>}
      />
      <div className="p-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : niches.length === 0 ? (
          <EmptyState icon={Layers} title="No niches yet" action={<Button onClick={() => setShowCreate(true)}><Plus className="size-4" /> New niche</Button>} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {niches.map((n: { id: string; name: string; description: string | null; isActive: boolean; _count: { clients: number; contentTemplates: number } }, i: number) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => toggleActive(n.id, !n.isActive)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                        {n.name[0]}
                      </div>
                      <Badge variant={n.isActive ? "success" : "muted"}>{n.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div>
                      <p className="font-semibold">{n.name}</p>
                      {n.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{n._count.clients} clients</span>
                      <span>{n._count.contentTemplates} templates</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create niche</DialogTitle>
            <DialogDescription>Define a new industry vertical for your platform.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input required placeholder="e.g. Dental, Café, Real Estate" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={creating}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
