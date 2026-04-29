"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { MessageSquare, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RequestData {
  id: string; status: string; comment: string; adminNote: string | null;
  createdAt: string; updatedAt: string;
  client: { businessName: string };
  contentItem: { template: { name: string; thumbnailUrl: string | null; contentType: string }; batch: { month: number; year: number } };
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function DesignRequestsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("PENDING");
  const [selected, setSelected] = useState<RequestData | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const key = `/api/admin/design-requests?status=${tab}&limit=20`;
  const { data, isLoading } = useSWR(key, fetcher);
  const requests: RequestData[] = data?.data ?? [];

  async function handleUpdate(status: "IN_PROGRESS" | "COMPLETED" | "REJECTED") {
    if (!selected) return;
    setUpdating(true);
    const res = await fetch(`/api/admin/design-requests/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote }),
    });
    setUpdating(false);
    if (res.ok) {
      setSelected(null);
      mutate(key);
      toast({ variant: "success", title: `Request marked as ${status.toLowerCase().replace("_", " ")}` });
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Design Requests"
        description="Client-submitted requests for design changes"
      />

      <div className="p-8 space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"].map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs">
                {s.replace("_", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={`No ${tab.toLowerCase().replace("_", " ")} requests`}
            description="Design change requests from clients will appear here."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((req, i) => (
              <motion.button
                key={req.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { setSelected(req); setAdminNote(req.adminNote ?? ""); }}
                className="w-full text-left p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{req.client.businessName}</p>
                      <Badge variant="muted" className="text-[10px]">{req.contentItem.template.contentType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {req.contentItem.template.name} — {MONTHS[req.contentItem.batch.month - 1]} {req.contentItem.batch.year}
                    </p>
                    <p className="text-sm line-clamp-2 mt-1">{req.comment}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={req.status as never} />
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Detail/action modal */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Design Request — {selected.client.businessName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Client's request</p>
                <p className="text-sm">{selected.comment}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Content</p>
                <p className="text-sm font-medium">{selected.contentItem.template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {MONTHS[selected.contentItem.batch.month - 1]} {selected.contentItem.batch.year}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Admin note (sent to client)</Label>
                <Textarea
                  rows={3}
                  placeholder="Add a note explaining your action or response…"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex-wrap gap-2 sm:flex-nowrap">
              {selected.status === "PENDING" && (
                <Button variant="outline" onClick={() => handleUpdate("IN_PROGRESS")} loading={updating}>
                  Mark In Progress
                </Button>
              )}
              {["PENDING", "IN_PROGRESS"].includes(selected.status) && (
                <>
                  <Button variant="success" onClick={() => handleUpdate("COMPLETED")} loading={updating}>
                    Mark Completed
                  </Button>
                  <Button variant="outline" className="text-destructive" onClick={() => handleUpdate("REJECTED")} loading={updating}>
                    Reject
                  </Button>
                </>
              )}
              {!["PENDING", "IN_PROGRESS"].includes(selected.status) && (
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
