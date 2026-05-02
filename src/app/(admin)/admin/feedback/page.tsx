"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { MessageCircle, Star, Send, Mail, MailOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  rating: number | null;
  isRead: boolean;
  adminResponse: string | null;
  createdAt: string;
  client: { id: string; businessName: string; user: { email: string } };
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    general: "bg-blue-100 text-blue-700",
    content: "bg-purple-100 text-purple-700",
    platform: "bg-cyan-100 text-cyan-700",
    support: "bg-amber-100 text-amber-700",
    billing: "bg-green-100 text-green-700",
  };
  return map[type] ?? "bg-gray-100 text-gray-700";
}

export default function FeedbackPage() {
  const { toast } = useToast();
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [response, setResponse] = useState("");
  const [sending, setSending] = useState(false);

  const key = `/api/admin/feedback?limit=50${filterType !== "all" ? `&type=${filterType}` : ""}${filterRead === "unread" ? "&isRead=false" : filterRead === "read" ? "&isRead=true" : ""}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const items: FeedbackItem[] = data?.data ?? [];

  const unreadCount = items.filter((i) => !i.isRead).length;

  async function handleOpen(item: FeedbackItem) {
    setSelected(item);
    setResponse(item.adminResponse ?? "");
    if (!item.isRead) {
      await fetch(`/api/admin/feedback/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      mutate(key);
    }
  }

  async function handleRespond(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    const res = await fetch(`/api/admin/feedback/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminResponse: response }),
    });
    setSending(false);
    if (res.ok) {
      mutate(key);
      const updated = await res.json();
      setSelected(updated.data);
      toast({ variant: "success", title: "Response saved" });
    } else {
      toast({ variant: "destructive", title: "Failed to save response" });
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Feedback"
        description={`Client feedback & support messages${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
      />

      <div className="p-8 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {["all", "unread", "read"].map((v) => (
              <button
                key={v}
                onClick={() => setFilterRead(v)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterRead === v ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {["all", "general", "content", "support", "billing", "platform"].map((v) => (
              <button
                key={v}
                onClick={() => setFilterType(v)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterType === v ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No feedback yet"
            description="Client feedback and support messages will appear here."
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <Card
                  className={`cursor-pointer hover:shadow-sm transition-all ${!item.isRead ? "border-primary/30 bg-primary/2" : ""}`}
                  onClick={() => handleOpen(item)}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="mt-0.5 shrink-0">
                      {item.isRead
                        ? <MailOpen className="size-4 text-muted-foreground" />
                        : <Mail className="size-4 text-primary" />
                      }
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{item.client.businessName}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${typeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <StarRating rating={item.rating} />
                        {!item.isRead && <Badge variant="default" className="text-[10px] py-0">New</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{item.client.user.email}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.adminResponse && <span className="text-emerald-600">✓ Responded</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selected.client.businessName}
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${typeColor(selected.type)}`}>
                  {selected.type}
                </span>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                {selected.client.user.email} · {new Date(selected.createdAt).toLocaleString()}
                {selected.rating && <StarRating rating={selected.rating} />}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 text-sm leading-relaxed">
                {selected.message}
              </div>

              {selected.adminResponse && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
                  <p className="text-xs font-medium text-emerald-700 mb-1.5">Your response</p>
                  <p className="text-emerald-800 leading-relaxed">{selected.adminResponse}</p>
                </div>
              )}

              <form onSubmit={handleRespond} className="space-y-3">
                <Textarea
                  rows={4}
                  placeholder="Write a response… (optional, visible to client)"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelected(null)}>Close</Button>
                  <Button type="submit" loading={sending} disabled={!response.trim()}>
                    <Send className="size-4" /> Save response
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
