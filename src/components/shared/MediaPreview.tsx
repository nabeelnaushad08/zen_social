"use client";

import Image from "next/image";
import { Play, FileImage } from "lucide-react";
import { cn } from "@/lib/cn";

interface MediaPreviewProps {
  url?: string | null;
  format?: string | null;
  resourceType?: string | null;
  alt?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait";
}

export function MediaPreview({
  url,
  format,
  resourceType,
  alt = "Content preview",
  className,
  aspectRatio = "square",
}: MediaPreviewProps) {
  const isVideo = resourceType === "video" || ["mp4", "mov", "webm"].includes(format ?? "");

  const aspectClass = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[4/5]",
  }[aspectRatio];

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-lg", aspectClass, className)}>
        <FileImage className="size-8 text-muted-foreground" />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden bg-black group", aspectClass, className)}>
        <video
          src={url}
          className="w-full h-full object-cover"
          preload="metadata"
          muted
          playsInline
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
          <div className="size-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="size-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-muted", aspectClass, className)}>
      <Image
        src={url}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
