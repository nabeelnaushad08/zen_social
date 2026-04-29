"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Check, RotateCcw, Palette, Edit3, Save,
  Globe, MessageSquare, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { MediaPreview } from "@/components/shared/MediaPreview";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ContentItemPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const key = `/api/client/content/${itemId}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const item = data?.data;

  // Editable text state
  const [tagline, setTagline] = useState("");
  const [caption, setCaption] = useState("");
  const [cta, setCta] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Design request modal
  const [showDesignRequest, setShowDesignRequest] = useState(false);
  const [requestComment, setRequestComment] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Revision modal
  const [showRevision, setShowRevision] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [requestingRevision, setRequestingRevision] = useState(false);

  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (item) {
      setTagline(item.tagline ?? item.template.defaultTagline ?? "");
      setCaption(item.caption ?? item.template.defaultCaption ?? "");
      setCta(item.cta ?? item.template.defaultCta ?? "");
    }
  }, [item]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(key, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagline, caption, cta }),
    });
    setSaving(false);
    if (res.ok) { setDirty(false); mutate(key); toast({ variant: "success", title: "Changes saved" }); }
    else toast({ variant: "destructive", title: "Failed to save" });
  }

  async function handleApprove() {
    setApproving(true);
    const res = await fetch(`/api/client/content/${itemId}/approve`, { method: "POST" });
    setApproving(false);
    if (res.ok) { mutate(key); toast({ variant: "success", title: "Content approved!" }); }
  }

  async function handleRevision() {
    if (revisionNote.length < 10) { toast({ variant: "destructive", title: "Please describe the revision needed (min 10 chars)" }); return; }
    setRequestingRevision(true);
    const res = await fetch(`/api/client/content/${itemId}/request-revision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionNote }),
    });
    setRequestingRevision(false);
    if (res.ok) { setShowRevision(false); mutate(key); toast({ title: "Revision requested — our team will review this" }); }
  }

  async function handleDesignRequest() {
    if (requestComment.length < 10) { toast({ variant: "destructive", title: "Please describe your request (min 10 chars)" }); return; }
    setSubmittingRequest(true);
    const res = await fetch(`/api/client/content/${itemId}/design-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: requestComment }),
    });
    setSubmittingRequest(false);
    if (res.ok) { setShowDesignRequest(false); toast({ variant: "success", title: "Design request submitted" }); }
    else { const err = await res.json(); toast({ variant: "destructive", title: err.error }); }
  }

  if (isLoading) {
    return (
      <div className="p-8 grid md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!item) return <div className="p-8 text-muted-foreground">Content not found.</div>;

  const isApproved = item.approvalStatus === "APPROVED";
  const isLocked = item.isLocked;

  return (
    <div className="animate-fade-in">
      {/* Back header */}
      <div className="flex items-center gap-3 px-8 py-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold">{item.template.name}</h1>
          <p className="text-xs text-muted-foreground">{item.template.contentType}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={item.approvalStatus} />
          {isLocked && (
            <Badge variant="muted"><Lock className="size-3" /> Locked</Badge>
          )}
        </div>
      </div>

      <div className="p-8 grid md:grid-cols-[1fr_420px] gap-8 max-w-6xl">
        {/* Left: Media preview */}
        <div className="space-y-4">
          <MediaPreview
            url={item.template.media?.secureUrl ?? item.template.thumbnailUrl}
            format={item.template.media?.format}
            resourceType={item.template.media?.resourceType}
            alt={item.template.name}
            aspectRatio="square"
          />

          {/* Platforms */}
          <div className="flex flex-wrap gap-2">
            {item.platforms.map((p: { platform: { slug: string; name: string } }) => (
              <Badge key={p.platform.slug} variant="outline">
                <Globe className="size-3" /> {p.platform.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Right: Text editing + actions */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <Tabs defaultValue="text">
            <TabsList className="w-full">
              <TabsTrigger value="text" className="flex-1 text-xs"><Edit3 className="size-3" /> Text</TabsTrigger>
              <TabsTrigger value="captions" className="flex-1 text-xs"><MessageSquare className="size-3" /> Captions</TabsTrigger>
            </TabsList>

            {/* Text edit tab */}
            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Tagline</Label>
                <Input
                  value={tagline}
                  onChange={(e) => { setTagline(e.target.value); setDirty(true); }}
                  placeholder={item.template.defaultTagline ?? "Enter tagline…"}
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Caption</Label>
                <Textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => { setCaption(e.target.value); setDirty(true); }}
                  placeholder={item.template.defaultCaption ?? "Enter caption…"}
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Call-to-action</Label>
                <Input
                  value={cta}
                  onChange={(e) => { setCta(e.target.value); setDirty(true); }}
                  placeholder={item.template.defaultCta ?? "e.g. Book now"}
                  disabled={isLocked}
                />
              </div>

              {dirty && !isLocked && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <Button onClick={handleSave} loading={saving} className="w-full">
                    <Save className="size-4" /> Save changes
                  </Button>
                </motion.div>
              )}
            </TabsContent>

            {/* Platform captions tab */}
            <TabsContent value="captions" className="space-y-3 mt-4">
              <p className="text-xs text-muted-foreground">Override captions for specific platforms. Leave blank to use the default caption.</p>
              {item.platforms.map((p: { platform: { slug: string; name: string; id: string } }) => {
                const existing = item.platformCaptions?.find(
                  (c: { platform: { slug: string }; caption: string }) => c.platform.slug === p.platform.slug,
                );
                return (
                  <PlatformCaptionEditor
                    key={p.platform.slug}
                    platform={p.platform}
                    initialCaption={existing?.caption ?? ""}
                    itemId={itemId}
                    disabled={isLocked}
                    onSave={() => mutate(key)}
                  />
                );
              })}
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Action buttons */}
          <div className="space-y-2">
            {!isApproved && (
              <Button
                className="w-full"
                variant="success"
                onClick={handleApprove}
                loading={approving}
                disabled={isLocked && !isApproved}
              >
                <Check className="size-4" /> Approve this content
              </Button>
            )}
            {isApproved && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-600 font-medium">
                <Check className="size-4" /> Approved
                {item.approval?.approvedAt && (
                  <span className="text-muted-foreground font-normal">
                    on {new Date(item.approval.approvedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
            {!isApproved && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowRevision(true)}
              >
                <RotateCcw className="size-4" /> Request revision
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setShowDesignRequest(true)}
            >
              <Palette className="size-4" /> Request design change
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Revision modal */}
      <Dialog open={showRevision} onOpenChange={setShowRevision}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request revision</DialogTitle>
            <DialogDescription>Describe what you'd like changed in the text or layout.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Textarea
              rows={4}
              placeholder="e.g. Please change the font colour on the tagline to match our brand blue (#0057FF)…"
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevision(false)}>Cancel</Button>
            <Button onClick={handleRevision} loading={requestingRevision}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Design request modal */}
      <Dialog open={showDesignRequest} onOpenChange={setShowDesignRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request design change</DialogTitle>
            <DialogDescription>
              Describe what design changes you'd like. Our team will review and update the design for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Textarea
              rows={5}
              placeholder="Describe the changes you'd like. Be as specific as possible — colours, fonts, layout, images…"
              value={requestComment}
              onChange={(e) => setRequestComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDesignRequest(false)}>Cancel</Button>
            <Button onClick={handleDesignRequest} loading={submittingRequest}>Submit request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlatformCaptionEditor({ platform, initialCaption, itemId, disabled, onSave }: {
  platform: { slug: string; name: string };
  initialCaption: string;
  itemId: string;
  disabled: boolean;
  onSave: () => void;
}) {
  const [caption, setCaption] = useState(initialCaption);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/client/content/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platformSlug: platform.slug, caption }),
    });
    setSaving(false);
    if (res.ok) { setDirty(false); onSave(); toast({ title: `${platform.name} caption saved` }); }
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{platform.name}</p>
      <Textarea
        rows={2}
        value={caption}
        onChange={(e) => { setCaption(e.target.value); setDirty(true); }}
        placeholder={`${platform.name} caption…`}
        disabled={disabled}
        className="text-xs"
      />
      {dirty && !disabled && (
        <Button size="sm" onClick={save} loading={saving} className="h-7 text-xs">
          <Save className="size-3" /> Save
        </Button>
      )}
    </div>
  );
}
