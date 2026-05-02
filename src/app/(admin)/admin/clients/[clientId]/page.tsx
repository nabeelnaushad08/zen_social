"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin,
  Plus, Trash2, ExternalLink, FileText, CreditCard, CheckSquare,
  Calendar, Edit2, Save, X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ClientDetail {
  id: string; businessName: string; slug: string; tagline: string | null;
  logoUrl: string | null; primaryColor: string | null; website: string | null;
  phone: string | null; address: string | null; isActive: boolean;
  onboardedAt: string | null; createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
  niche: { id: string; name: string } | null;
  package: { id: string; name: string; monthlyPostLimit: number } | null;
}

interface Contract {
  id: string; title: string; status: string; startDate: string;
  endDate: string | null; documentUrl: string | null; notes: string | null; createdAt: string;
}

interface Payment {
  id: string; amount: string; currency: string; status: string;
  dueDate: string; paidAt: string | null; invoiceUrl: string | null;
  description: string | null; createdAt: string;
}

interface ClientTask {
  id: string; title: string; description: string | null; status: string;
  link: string | null; linkLabel: string | null; dueDate: string | null;
  sortOrder: number; createdAt: string;
}

interface Batch {
  id: string; month: number; year: number; status: string;
  publishedAt: string | null; dueDate: string | null;
  _count: { contentItems: number };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function contractStatusColor(s: string) {
  if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700";
  if (s === "EXPIRED") return "bg-gray-100 text-gray-600";
  if (s === "CANCELLED") return "bg-red-100 text-red-600";
  return "bg-amber-100 text-amber-700";
}

function paymentStatusColor(s: string) {
  if (s === "PAID") return "bg-emerald-100 text-emerald-700";
  if (s === "OVERDUE") return "bg-red-100 text-red-600";
  if (s === "CANCELLED") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-700";
}

function taskStatusColor(s: string) {
  if (s === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (s === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
  if (s === "CANCELLED") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-700";
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ client }: { client: ClientDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Business info</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {client.tagline && <p className="text-muted-foreground italic">"{client.tagline}"</p>}
          {client.user.email && (
            <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{client.user.email}</div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{client.phone}</div>
          )}
          {client.website && (
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{client.website}</a>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{client.address}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Package & plan</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Niche</span><span>{client.niche?.name ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span>{client.package?.name ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Monthly posts</span><span>{client.package?.monthlyPostLimit ?? "—"}</span></div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={client.isActive ? "success" : "muted"}>{client.isActive ? "Active" : "Inactive"}</Badge>
          </div>
          {client.onboardedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Onboarded</span>
              <span>{new Date(client.onboardedAt).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span>{new Date(client.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Batches Tab ───────────────────────────────────────────────────────────────

function BatchesTab({ clientId }: { clientId: string }) {
  const { data, isLoading } = useSWR(`/api/admin/batches?clientId=${clientId}&limit=20`, fetcher);
  const batches: Batch[] = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button asChild size="sm"><Link href="/admin/batches"><Plus className="size-4" /> New batch</Link></Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : batches.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No batches yet.</p>
      ) : (
        <div className="space-y-2">
          {batches.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-sm">{MONTHS[b.month - 1]} {b.year}</p>
                <p className="text-xs text-muted-foreground">{b._count.contentItems} items{b.dueDate ? ` · Due ${new Date(b.dueDate).toLocaleDateString()}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={b.status as never} />
                <Button variant="ghost" size="sm" asChild><Link href={`/admin/batches/${b.id}`}>Open</Link></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Contracts Tab ─────────────────────────────────────────────────────────────

function ContractsTab({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const key = `/api/admin/clients/${clientId}/contracts`;
  const { data, isLoading } = useSWR(key, fetcher);
  const contracts: Contract[] = data?.data ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", status: "ACTIVE", startDate: "", endDate: "", documentUrl: "", notes: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, endDate: form.endDate || null, documentUrl: form.documentUrl || null, notes: form.notes || null }),
    });
    setSaving(false);
    if (res.ok) {
      globalMutate(key);
      setShowAdd(false);
      setForm({ title: "", status: "ACTIVE", startDate: "", endDate: "", documentUrl: "", notes: "" });
      toast({ variant: "success", title: "Contract added" });
    } else {
      toast({ variant: "destructive", title: "Failed to add contract" });
    }
  }

  async function handleDelete(id: string) {
    await fetch(`${key}/${id}`, { method: "DELETE" });
    globalMutate(key);
    toast({ title: "Contract deleted" });
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`${key}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    globalMutate(key);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="size-4" /> Add contract</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({length:2}).map((_,i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : contracts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No contracts yet.</p>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => {
            const days = daysUntil(c.endDate);
            return (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{c.title}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${contractStatusColor(c.status)}`}>{c.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.startDate).toLocaleDateString()}
                      {c.endDate && <> → {new Date(c.endDate).toLocaleDateString()}</>}
                      {days !== null && (
                        <span className={`ml-2 font-medium ${days < 0 ? "text-red-600" : days < 30 ? "text-amber-600" : "text-emerald-600"}`}>
                          {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d remaining`}
                        </span>
                      )}
                    </p>
                    {c.notes && <p className="text-xs text-muted-foreground line-clamp-2">{c.notes}</p>}
                    {c.documentUrl && (
                      <a href={c.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="size-3" /> View document
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className="text-xs rounded border border-input bg-background px-1.5 py-1"
                    >
                      {["ACTIVE","PENDING","EXPIRED","CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add contract</DialogTitle>
            <DialogDescription>Create a new contract for this client.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="e.g. Monthly Social Media Agreement" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start date *</Label>
                <Input type="date" required value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                {["ACTIVE","PENDING","EXPIRED","CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Document URL</Label>
              <Input type="url" value={form.documentUrl} onChange={(e) => setForm({...form, documentUrl: e.target.value})} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Add contract</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Payments Tab ──────────────────────────────────────────────────────────────

function PaymentsTab({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const key = `/api/admin/clients/${clientId}/payments`;
  const { data, isLoading } = useSWR(key, fetcher);
  const payments: Payment[] = data?.data ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: "", currency: "USD", status: "UNPAID", dueDate: "", description: "", invoiceUrl: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        invoiceUrl: form.invoiceUrl || null,
        description: form.description || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      globalMutate(key);
      setShowAdd(false);
      setForm({ amount: "", currency: "USD", status: "UNPAID", dueDate: "", description: "", invoiceUrl: "" });
      toast({ variant: "success", title: "Payment record added" });
    } else {
      toast({ variant: "destructive", title: "Failed to add payment" });
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`${key}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(status === "PAID" && { paidAt: new Date().toISOString() }) }),
    });
    globalMutate(key);
  }

  async function handleDelete(id: string) {
    await fetch(`${key}/${id}`, { method: "DELETE" });
    globalMutate(key);
    toast({ title: "Payment deleted" });
  }

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalOutstanding = payments.filter((p) => p.status === "UNPAID" || p.status === "OVERDUE").reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-6 text-sm">
          <span className="text-muted-foreground">Paid: <strong className="text-emerald-600">${totalPaid.toFixed(2)}</strong></span>
          <span className="text-muted-foreground">Outstanding: <strong className="text-amber-600">${totalOutstanding.toFixed(2)}</strong></span>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="size-4" /> Add payment</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : payments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No payment records yet.</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{p.currency} {parseFloat(p.amount).toFixed(2)}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${paymentStatusColor(p.status)}`}>{p.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Due {new Date(p.dueDate).toLocaleDateString()}
                  {p.paidAt && <> · Paid {new Date(p.paidAt).toLocaleDateString()}</>}
                  {p.description && <> · {p.description}</>}
                </p>
                {p.invoiceUrl && (
                  <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="size-3" /> Invoice
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={p.status}
                  onChange={(e) => handleStatusChange(p.id, e.target.value)}
                  className="text-xs rounded border border-input bg-background px-1.5 py-1"
                >
                  {["UNPAID","PAID","OVERDUE","CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add payment record</DialogTitle>
            <DialogDescription>Record a payment for this client.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input type="number" step="0.01" min="0" required value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="299.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})} placeholder="USD" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Due date *</Label>
                <Input type="date" required value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {["UNPAID","PAID","OVERDUE","CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="e.g. Monthly retainer – May 2025" />
            </div>
            <div className="space-y-1.5">
              <Label>Invoice URL</Label>
              <Input type="url" value={form.invoiceUrl} onChange={(e) => setForm({...form, invoiceUrl: e.target.value})} placeholder="https://..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Add payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tasks Tab ─────────────────────────────────────────────────────────────────

function TasksTab({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const key = `/api/admin/clients/${clientId}/tasks`;
  const { data, isLoading } = useSWR(key, fetcher);
  const tasks: ClientTask[] = data?.data ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "PENDING", link: "", linkLabel: "", dueDate: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        link: form.link || null,
        linkLabel: form.linkLabel || null,
        description: form.description || null,
        dueDate: form.dueDate || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      globalMutate(key);
      setShowAdd(false);
      setForm({ title: "", description: "", status: "PENDING", link: "", linkLabel: "", dueDate: "" });
      toast({ variant: "success", title: "Task assigned" });
    } else {
      toast({ variant: "destructive", title: "Failed to assign task" });
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`${key}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    globalMutate(key);
  }

  async function handleDelete(id: string) {
    await fetch(`${key}/${id}`, { method: "DELETE" });
    globalMutate(key);
    toast({ title: "Task deleted" });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="size-4" /> Assign task</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No tasks assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-start justify-between p-4 rounded-xl border bg-card">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{t.title}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${taskStatusColor(t.status)}`}>{t.status.replace("_"," ")}</span>
                </div>
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                  {t.dueDate && <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(t.dueDate).toLocaleDateString()}</span>}
                  {t.link && (
                    <a href={t.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="size-3" />{t.linkLabel || t.link}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  className="text-xs rounded border border-input bg-background px-1.5 py-1"
                >
                  {["PENDING","IN_PROGRESS","COMPLETED","CANCELLED"].map((s) => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                </select>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign task</DialogTitle>
            <DialogDescription>Add an action item visible to the client.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="e.g. Review brand guidelines" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {["PENDING","IN_PROGRESS","COMPLETED","CANCELLED"].map((s) => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Link URL</Label>
                <Input type="url" value={form.link} onChange={(e) => setForm({...form, link: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Link label</Label>
                <Input value={form.linkLabel} onChange={(e) => setForm({...form, linkLabel: e.target.value})} placeholder="View document" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Assign task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const clientId = params.clientId;

  const { data, isLoading } = useSWR(`/api/admin/clients/${clientId}`, fetcher);
  const client: ClientDetail | null = data?.data ?? null;

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={client.businessName}
        description={`${client.user.firstName} ${client.user.lastName} · ${client.user.email}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        }
      />

      <div className="p-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview"><Building2 className="size-4 mr-1.5" />Overview</TabsTrigger>
            <TabsTrigger value="batches"><Calendar className="size-4 mr-1.5" />Batches</TabsTrigger>
            <TabsTrigger value="contracts"><FileText className="size-4 mr-1.5" />Contracts</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="size-4 mr-1.5" />Payments</TabsTrigger>
            <TabsTrigger value="tasks"><CheckSquare className="size-4 mr-1.5" />Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab client={client} /></TabsContent>
          <TabsContent value="batches"><BatchesTab clientId={clientId} /></TabsContent>
          <TabsContent value="contracts"><ContractsTab clientId={clientId} /></TabsContent>
          <TabsContent value="payments"><PaymentsTab clientId={clientId} /></TabsContent>
          <TabsContent value="tasks"><TasksTab clientId={clientId} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
