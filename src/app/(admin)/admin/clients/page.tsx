"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users, MoreHorizontal, Eye, ToggleLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

function ClientRow({ client, onToggle }: { client: ClientData; onToggle: (id: string, active: boolean) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
    >
      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
        {client.businessName[0]}
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-3 gap-4 items-center">
        <div>
          <p className="font-medium text-sm truncate">{client.businessName}</p>
          <p className="text-xs text-muted-foreground truncate">{client.user.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{client.niche?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{client.package?.name ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={client.isActive ? "success" : "muted"}>
            {client.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground hidden lg:block">
        {new Date(client.createdAt).toLocaleDateString()}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/clients/${client.id}`}>
              <Eye className="size-4" /> View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onToggle(client.id, !client.isActive)}>
            <ToggleLeft className="size-4" />
            {client.isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

interface ClientData {
  id: string;
  businessName: string;
  isActive: boolean;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string };
  niche: { name: string } | null;
  package: { name: string } | null;
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", businessName: "", nicheId: "", packageId: "" });

  const key = `/api/admin/clients?search=${encodeURIComponent(search)}&limit=20`;
  const { data, isLoading } = useSWR(key, fetcher);
  const { data: nichesData } = useSWR("/api/admin/niches", fetcher);
  const { data: packagesData } = useSWR("/api/admin/packages", fetcher);

  const clients: ClientData[] = data?.data ?? [];

  async function handleToggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    mutate(key);
    toast({ title: isActive ? "Client activated" : "Client deactivated" });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      setShowCreate(false);
      mutate(key);
      toast({ variant: "success", title: "Client created successfully" });
    } else {
      const err = await res.json();
      toast({ variant: "destructive", title: "Failed to create client", description: err.error });
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Clients"
        description={`${data?.meta?.total ?? 0} total accounts`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4" /> New client
          </Button>
        }
      />

      <div className="p-8 space-y-4">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="size-10 shrink-0" />
          <div className="flex-1 grid grid-cols-3 gap-4">
            <span>Business / Email</span>
            <span>Niche / Package</span>
            <span>Status</span>
          </div>
          <span className="hidden lg:block w-24">Created</span>
          <div className="size-7" />
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[70px] w-full rounded-xl" />)}
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Create your first client to get started."
            action={<Button onClick={() => setShowCreate(true)}><Plus className="size-4" /> New client</Button>}
          />
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <ClientRow key={c.id} client={c} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </div>

      {/* Create client modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create client</DialogTitle>
            <DialogDescription>Set up a new client account and assign their niche and package.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Niche</Label>
                <select
                  required
                  value={form.nicheId}
                  onChange={(e) => setForm({ ...form, nicheId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select niche</option>
                  {(nichesData?.data ?? []).map((n: { id: string; name: string }) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Package</Label>
                <select
                  required
                  value={form.packageId}
                  onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select package</option>
                  {(packagesData?.data ?? []).map((p: { id: string; name: string }) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={creating}>Create client</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
