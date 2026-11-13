"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Film, AlertCircle, RotateCcw } from "lucide-react";
import { AR_STRINGS } from "@/messages/ar";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-light-1 text-xs font-medium text-text-muted font-arabic animate-pulse">
      جارٍ تهيئة مشغل الفيديو...
    </div>
  ),
});

interface PublicVideoPlayerProps {
  slug?: string;
  procedureId?: string;
  title: string;
  status?: string;
  playbackId?: string | null;
  isDraftPreview?: boolean;
}

export function PublicVideoPlayer({
  slug,
  procedureId,
  title,
  status = "none",
  playbackId,
}: PublicVideoPlayerProps) {
  const isVideoReady = status === "ready" && !!playbackId;

  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState<boolean>(isVideoReady);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<boolean>(false);

  const fetchToken = useCallback(async () => {
    if (!isVideoReady) return;
    setLoadingToken(true);
    setTokenError(null);

    try {
      const url = slug
        ? `/api/video-token?slug=${encodeURIComponent(slug)}`
        : `/api/video-token?id=${encodeURIComponent(procedureId || "")}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.token) {
        throw new Error("لم يتم استلام تصريح تشغيل الفيديو.");
      }

      setToken(data.token);
    } catch (err: any) {
      setTokenError(err.message || "حدث خطأ أثناء الحصول على تصريح المشاهدة.");
    } finally {
      setLoadingToken(false);
    }
  }, [isVideoReady, slug, procedureId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const pState = urlParams.get("public_video_state");
      if (pState === "empty") {
        setToken(null);
        setLoadingToken(false);
        return;
      } else if (pState === "error") {
        setToken(null);
        setLoadingToken(false);
        setPlayerError(true);
        return;
      }
    }

    if (isVideoReady) {
      fetchToken();
    }
  }, [isVideoReady, fetchToken]);

  return (
    <div
      className="w-full"
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <div
        className={`relative flex aspect-video w-full select-none items-center justify-center overflow-hidden rounded-2xl border border-border-subtle text-center shadow-sm ${
          !isVideoReady || tokenError || playerError
            ? "bg-light-1"
            : "bg-navy"
        }`}
        data-testid="public-video-container"
      >
        {/* State 1: No Ready Video */}
        {!isVideoReady && (
          <div className="flex flex-col items-center justify-center gap-3 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-pill border border-border-subtle bg-white text-rose-dark shadow-xs">
              <Film className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-navy font-arabic">
              {AR_STRINGS.videoPublicEmpty}
            </p>
          </div>
        )}

        {/* State 2: Loading Signed Playback Token */}
        {isVideoReady && loadingToken && (
          <div className="flex h-full w-full flex-col items-center justify-center space-y-3 bg-light-1 p-6 animate-pulse">
            <div className="flex h-12 w-12 items-center justify-center rounded-pill bg-white text-rose-dark">
              <Film className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium text-text-secondary font-arabic">
              جارٍ التحقق من صلاحيات المشاهدة الآمنة...
            </p>
          </div>
        )}

        {/* State 3: Playback or Token Error */}
        {isVideoReady && !loadingToken && (tokenError || playerError) && (
          <div className="flex max-w-sm flex-col items-center justify-center gap-3 p-6 text-danger">
            <AlertCircle className="h-8 w-8 text-danger" aria-hidden="true" />
            <p className="text-base font-semibold leading-relaxed font-arabic">
              تعذر تشغيل الفيديو
            </p>
            <button
              type="button"
              onClick={() => {
                setPlayerError(false);
                setTokenError(null);
                fetchToken();
              }}
              className="mt-1 inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-danger bg-danger-surface px-4 py-2 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{AR_STRINGS.videoPublicRetry}</span>
            </button>
          </div>
        )}

        {/* State 4: Light-Themed Signed Mux Player with Rose Accent & Watermark */}
        {isVideoReady && !loadingToken && token && playbackId && !playerError && (
          <div className="relative h-full w-full" dir="ltr" lang="en">
            <MuxPlayer
              playbackId={playbackId}
              tokens={{
                playback: token,
              }}
              metadata={{
                video_title: title,
              }}
              autoPlay={false}
              playsInline={true}
              streamType="on-demand"
              preferPlayback="mse"
              className="h-full w-full"
              style={
                {
                  "--primary-color": "#c87475",
                  "--accent-color": "#c87475",
                  "--media-range-bar-color": "#c87475",
                } as React.CSSProperties & Record<`--${string}`, string>
              }
              disablePictureInPicture={true}
              onError={() => {
                setPlayerError(true);
              }}
            />

            {/* Non-interactive brand watermark overlay */}
            <div
              className="pointer-events-none absolute end-3 top-3 z-10 opacity-45"
              aria-hidden="true"
            >
              <Image
                src="/brand/watermark.png"
                alt=""
                width={130}
                height={24}
                className="h-auto w-[110px] select-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
