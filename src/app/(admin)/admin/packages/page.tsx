"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { Plus, Package, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const CONTENT_TYPES = ["BANNER", "VIDEO", "STORY", "REEL", "CAROUSEL", "SOCIAL_PROOF", "INFOGRAPHIC"];

interface Category { name: string; contentType: string; monthlyLimit: number; sortOrder: number }

export default function PackagesPage() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", monthlyPostLimit: 20, price: 0, nicheId: "" });
  const [categories, setCategories] = useState<Category[]>([{ name: "", contentType: "BANNER", monthlyLimit: 8, sortOrder: 0 }]);

  const key = "/api/admin/packages";
  const { data, isLoading } = useSWR(key, fetcher);
  const { data: nichesData } = useSWR("/api/admin/niches", fetcher);
  const packages = data?.data ?? [];

  function addCategory() {
    setCategories([...categories, { name: "", contentType: "BANNER", monthlyLimit: 4, sortOrder: categories.length }]);
  }
  function removeCategory(i: number) { setCategories(categories.filter((_, idx) => idx !== i)); }
  function updateCategory(i: number, field: keyof Category, value: string | number) {
    setCategories(categories.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/packages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categories }),
    });
    setCreating(false);
    if (res.ok) { setShowCreate(false); mutate(key); toast({ variant: "success", title: "Package created" }); }
    else { const err = await res.json(); toast({ variant: "destructive", title: err.error }); }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Packages"
        description="Subscription tiers with defined content limits"
        action={<Button onClick={() => setShowCreate(true)}><Plus className="size-4" /> New package</Button>}
      />
      <div className="p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : packages.length === 0 ? (
          <EmptyState icon={Package} title="No packages yet" action={<Button onClick={() => setShowCreate(true)}><Plus className="size-4" /> New package</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((p: { id: string; name: string; description: string | null; monthlyPostLimit: number; price: string; isActive: boolean; niche: { name: string } | null; packageCategories: Category[]; _count: { clients: number } }, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        {p.niche && <p className="text-xs text-muted-foreground mt-0.5">{p.niche.name}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${p.price}/mo</p>
                        <Badge variant={p.isActive ? "success" : "muted"} className="text-[10px]">{p.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{p.monthlyPostLimit} posts/month</p>
                    <Separator />
                    <div className="space-y-1.5">
                      {p.packageCategories.map((cat, ci) => (
                        <div key={ci} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{cat.name || cat.contentType}</span>
                          <Badge variant="outline">{cat.monthlyLimit}/mo</Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{p._count.clients} clients on this plan</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create package</DialogTitle>
            <DialogDescription>Define a subscription tier with content category limits.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Package name *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Price ($/month) *</Label>
                <Input type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Monthly post limit *</Label>
                <Input type="number" min={1} required value={form.monthlyPostLimit} onChange={(e) => setForm({ ...form, monthlyPostLimit: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Niche (optional)</Label>
                <select value={form.nicheId} onChange={(e) => setForm({ ...form, nicheId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">Universal</option>
                  {(nichesData?.data ?? []).map((n: { id: string; name: string }) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content categories *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCategory}><Plus className="size-3" /> Add</Button>
              </div>
              <div className="space-y-2">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-end gap-2 rounded-lg border p-3 bg-muted/30">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Category name</Label>
                      <Input value={cat.name} placeholder="e.g. Promotional Banners" onChange={(e) => updateCategory(i, "name", e.target.value)} />
                    </div>
                    <div className="space-y-1.5 w-32">
                      <Label className="text-xs">Type</Label>
                      <select value={cat.contentType} onChange={(e) => updateCategory(i, "contentType", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5 w-20">
                      <Label className="text-xs">Limit/mo</Label>
                      <Input type="number" min={1} value={cat.monthlyLimit} onChange={(e) => updateCategory(i, "monthlyLimit", Number(e.target.value))} />
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" className="text-destructive mb-0.5" onClick={() => removeCategory(i)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={creating}>Create package</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
