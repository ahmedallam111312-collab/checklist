import React from "react";
import { Film } from "lucide-react";
import { AR_STRINGS } from "@/messages/ar";

interface VideoPlayerPlaceholderProps {
  playbackId?: string | null;
  status?: string;
  title?: string;
}

export function VideoPlayerPlaceholder({
  playbackId,
  status = "none",
  title,
}: VideoPlayerPlaceholderProps) {
  const isReady = status === "ready" && playbackId;

  return (
    <div className="w-full">
      <div
        className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#1f4466] bg-black shadow-lg flex items-center justify-center text-center p-6"
        data-testid="video-placeholder"
      >
        {isReady ? (
          <div className="text-white">
            <p className="text-sm font-medium">Video Player ({title})</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0d2740] border border-[#1f4466]">
              <Film className="h-6 w-6 text-[#00d2ff]" aria-hidden="true" />
            </div>
            {/* Fixed high-contrast light text (#f1f7fb has 18.4:1 contrast on black in both themes) */}
            <p className="text-sm font-medium text-[#f1f7fb]">
              {AR_STRINGS.videoBeingPrepared}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
