"use client";

import React from "react";
import { PublicVideoPlayer } from "@/components/PublicVideoPlayer";

export interface VideoPlayerPlaceholderProps {
  slug?: string;
  procedureId?: string;
  playbackId?: string | null;
  status?: string;
  title?: string;
  isDraftPreview?: boolean;
}

export function VideoPlayerPlaceholder({
  slug,
  procedureId,
  playbackId,
  status = "none",
  title = "",
  isDraftPreview = false,
}: VideoPlayerPlaceholderProps) {
  return (
    <PublicVideoPlayer
      slug={slug}
      procedureId={procedureId}
      playbackId={playbackId}
      status={status}
      title={title}
      isDraftPreview={isDraftPreview}
    />
  );
}
