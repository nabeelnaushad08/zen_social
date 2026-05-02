"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { Plus, Search, Upload, Globe, FileImage, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MediaPreview } from "@/components/shared/MediaPreview";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CONTENT_TYPES = ["BANNER", "VIDEO", "STORY", "REEL", "CAROUSEL", "SOCIAL_PROOF", "INFOGRAPHIC"];
const PLATFORM_SLUGS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "GOOGLE_MY_BUSINESS", "TWITTER_X", "PINTEREST", "TIKTOK", "YOUTUBE", "TRIPADVISOR", "LINKTREE", "BLUESKY"];

interface TemplateData {
  id: string; name: string; contentType: string; status: string; thumbnailUrl: string | null;
  defaultTagline: string | null; defaultCaption: string | null;
  niche: { name: string } | null;
  platforms: { platform: { slug: string; name: string } }[];
}

function TemplateCard({ template, onStatusChange }: { template: TemplateData; onStatusChange: () => void }) {
  const { toast } = useToast();

  async function setStatus(status: string) {
    const res = await fetch(`/api/admin/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { onStatusChange(); toast({ title: `Template ${status.toLowerCase()}` }); }
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="overflow-hidden group hover:shadow-md transition-shadow">
        <div className="relative">
          <MediaPreview
            url={template.thumbnailUrl}
            alt={template.name}
            aspectRatio="square"
            className="rounded-none"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon-sm" className="shadow-sm">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {template.status !== "PUBLISHED" && (
                  <DropdownMenuItem onClick={() => setStatus("PUBLISHED")}>Publish</DropdownMenuItem>
                )}
                {template.status !== "DRAFT" && (
                  <DropdownMenuItem onClick={() => setStatus("DRAFT")}>Move to draft</DropdownMenuItem>
                )}
                {template.status !== "ARCHIVED" && (
                  <DropdownMenuItem className="text-destructive" onClick={() => setStatus("ARCHIVED")}>
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="absolute bottom-2 left-2">
            <StatusBadge status={template.status as never} />
          </div>
        </div>
        <CardContent className="p-3 space-y-2">
          <div>
            <p className="font-medium text-sm leading-tight truncate">{template.name}</p>
            {template.niche && (
              <p className="text-xs text-muted-foreground">{template.niche.name}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="muted" className="text-[10px]">{template.contentType}</Badge>
          </div>
          {template.platforms.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {template.platforms.slice(0, 3).map((p) => p.platform.name).join(", ")}
              {template.platforms.length > 3 && ` +${template.platforms.length - 3}`}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", contentType: "BANNER", nicheId: "", packageCategoryId: "",
    defaultTagline: "", defaultCaption: "", defaultCta: "",
    cloudinaryId: "", url: "", secureUrl: "", format: "", resourceType: "image",
    width: 0, height: 0, bytes: 0, folder: "",
  });

  const key = `/api/admin/templates?status=${tab === "ALL" ? "" : tab}&search=${encodeURIComponent(search)}&limit=24`;
  const { data, isLoading } = useSWR(key, fetcher);
  const { data: nichesData } = useSWR("/api/admin/niches", fetcher);

  const templates: TemplateData[] = data?.data ?? [];

  // Simulated Cloudinary upload (in production the Cloudinary Widget handles this)
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    // 1. Get signature from our API
    const signRes = await fetch("/api/upload/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: "template", nicheSlug: "general" }),
    });
    const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

    // 2. Upload to Cloudinary
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", apiKey);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);
    fd.append("folder", folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: fd,
    });
    const uploadData = await uploadRes.json();
    setUploading(false);

    if (uploadData.public_id) {
      setForm((f) => ({
        ...f,
        cloudinaryId: uploadData.public_id,
        url: uploadData.url,
        secureUrl: uploadData.secure_url,
        format: uploadData.format,
        resourceType: uploadData.resource_type,
        width: uploadData.width ?? 0,
        height: uploadData.height ?? 0,
        bytes: uploadData.bytes ?? 0,
        folder,
      }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cloudinaryId) { toast({ variant: "destructive", title: "Please upload a file first" }); return; }
    if (selectedPlatforms.length === 0) { toast({ variant: "destructive", title: "Select at least one platform" }); return; }

    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, platformSlugs: selectedPlatforms }),
    });

    if (res.ok) {
      setShowUpload(false);
      mutate(key);
      toast({ variant: "success", title: "Template created" });
    } else {
      const err = await res.json();
      toast({ variant: "destructive", title: "Error", description: err.error });
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Content Templates"
        description="Master designs available for monthly batches"
        action={
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="size-4" /> Upload template
          </Button>
        }
      />

      <div className="p-8 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search templates…" className="pl-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              {["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
                <TabsTrigger key={s} value={s} className="text-xs">{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={FileImage}
            title="No templates yet"
            description="Upload your first content template to start building batches."
            action={<Button onClick={() => setShowUpload(true)}><Upload className="size-4" /> Upload template</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onStatusChange={() => mutate(key)} />
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload content template</DialogTitle>
            <DialogDescription>Upload a design and configure its settings.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            {/* File upload zone */}
            <div className="relative border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              {form.secureUrl ? (
                <div className="space-y-2">
                  <MediaPreview url={form.secureUrl} format={form.format} resourceType={form.resourceType} className="max-h-40 w-auto mx-auto" />
                  <p className="text-xs text-muted-foreground">File uploaded ✓</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="size-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Drop file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">Images or videos</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {uploading && (
                <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Template name *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Content type *</Label>
                <select required value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Niche (optional)</Label>
              <select value={form.nicheId} onChange={(e) => setForm({ ...form, nicheId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Universal (all niches)</option>
                {(nichesData?.data ?? []).map((n: { id: string; name: string }) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Default tagline</Label>
                <Input placeholder="Your tagline" value={form.defaultTagline} onChange={(e) => setForm({ ...form, defaultTagline: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Default CTA</Label>
                <Input placeholder="Book now" value={form.defaultCta} onChange={(e) => setForm({ ...form, defaultCta: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Default caption</Label>
              <Textarea rows={3} value={form.defaultCaption} onChange={(e) => setForm({ ...form, defaultCaption: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Platforms *</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_SLUGS.map((slug) => {
                  const active = selectedPlatforms.includes(slug);
                  return (
                    <button
                      type="button"
                      key={slug}
                      onClick={() => setSelectedPlatforms(active ? selectedPlatforms.filter((s) => s !== slug) : [...selectedPlatforms, slug])}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${active ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-input hover:border-primary"}`}
                    >
                      {slug.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
              <Button type="submit" disabled={uploading || !form.cloudinaryId}>Create template</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
