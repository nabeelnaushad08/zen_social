"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { MessageSquarePlus, Star } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const FEEDBACK_TYPES = [
  { value: "GENERAL", label: "General" },
  { value: "CONTENT_QUALITY", label: "Content Quality" },
  { value: "PLATFORM_COVERAGE", label: "Platform Coverage" },
  { value: "TURNAROUND_TIME", label: "Turnaround Time" },
  { value: "COMMUNICATION", label: "Communication" },
];

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  rating: number | null;
  createdAt: string;
  status: string;
  adminResponse: string | null;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`size-6 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: "GENERAL", message: "", rating: 0 });

  const key = "/api/client/feedback";
  const { data, isLoading } = useSWR(key, fetcher);
  const feedbackList: FeedbackItem[] = data?.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSubmitting(true);
    const res = await fetch(key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        message: form.message,
        rating: form.rating > 0 ? form.rating : undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm({ type: "GENERAL", message: "", rating: 0 });
      mutate(key);
      toast({ variant: "success", title: "Feedback submitted", description: "Thank you for your feedback!" });
    } else {
      const err = await res.json();
      toast({ variant: "destructive", title: err.error ?? "Failed to submit" });
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Feedback"
        description="Share your thoughts to help us improve"
      />

      <div className="p-8 space-y-8 max-w-3xl">
        {/* Submit form */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-sm mb-4">Submit feedback</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {FEEDBACK_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm({ ...form, type: value })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          form.type === value
                            ? "bg-primary text-white border-primary"
                            : "bg-background text-muted-foreground border-input hover:border-primary"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-1.5">
                  <Label>Rating (optional)</Label>
                  <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label>Message *</Label>
                  <Textarea
                    required
                    rows={4}
                    placeholder="Tell us what's working well or what could be improved…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                  Submit feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Past feedback */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Your previous feedback</h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : feedbackList.length === 0 ? (
            <EmptyState
              icon={MessageSquarePlus}
              title="No feedback yet"
              description="Your submitted feedback will appear here."
              className="py-12"
            />
          ) : (
            <div className="space-y-3">
              {feedbackList.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 rounded-xl border bg-card space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="muted" className="text-[10px]">
                        {FEEDBACK_TYPES.find((t) => t.value === item.type)?.label ?? item.type}
                      </Badge>
                      {item.rating && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: item.rating }).map((_, si) => (
                            <Star key={si} className="size-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="text-sm">{item.message}</p>

                  {item.adminResponse && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                      <p className="text-xs text-primary font-medium mb-0.5">Team response</p>
                      <p className="text-sm">{item.adminResponse}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
