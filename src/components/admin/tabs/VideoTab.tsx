"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import {
  Upload,
  Video,
  Play,
  RotateCcw,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  FileVideo,
} from "lucide-react";
import * as UpChunk from "@mux/upchunk";
import { Procedure, VideoStatus } from "@/types/database";
import { AR_STRINGS } from "@/messages/ar";
import {
  getVideoConfigState,
  requestVideoUploadUrl,
  pollVideoStatus,
  deleteProcedureVideo,
  finalizeVideoReplacement,
  getVideoUsageSummary,
} from "@/app/admin/actions/video";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video rounded-tile bg-light-1 flex items-center justify-center animate-pulse text-xs text-text-secondary">
      Loading video player...
    </div>
  ),
});

interface VideoTabProps {
  procedure: Procedure;
  onProcedureUpdated?: (updated: Partial<Procedure>) => void;
}

export function VideoTab({ procedure, onProcedureUpdated }: VideoTabProps) {
  // Config & environment status
  const [mounted, setMounted] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Quota & usage state
  const [usageCount, setUsageCount] = useState(0);
  const [quotaBlocked, setQuotaBlocked] = useState(false);

  // Current procedure video state
  const [status, setStatus] = useState<VideoStatus>(
    (procedure.video_status as VideoStatus) || "none"
  );
  const [playbackId, setPlaybackId] = useState<string | null>(
    procedure.mux_playback_id || null
  );
  const [durationSeconds, setDurationSeconds] = useState<number | null>(
    procedure.video_duration_seconds || null
  );
  const [videoError, setVideoError] = useState<string | null>(
    procedure.video_error || null
  );

  // Uploading state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const upChunkUploadRef = useRef<any>(null);

  // Replacement tracking
  const [isReplacing, setIsReplacing] = useState<boolean>(false);
  const [pendingOldAssetId, setPendingOldAssetId] = useState<string | null>(null);

  // Admin Playback Token & Player Error state
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loadingAdminToken, setLoadingAdminToken] = useState<boolean>(false);
  const [adminPlayerError, setAdminPlayerError] = useState<boolean>(false);

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const cancelDeleteBtnRef = useRef<HTMLButtonElement>(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus Cancel button when delete confirmation modal opens
  useEffect(() => {
    if (isDeleteDialogOpen) {
      const timer = setTimeout(() => {
        cancelDeleteBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDeleteDialogOpen]);

  // Fetch signed admin preview token when video is ready
  const fetchAdminToken = useCallback(async () => {
    if (!playbackId) return;
    setLoadingAdminToken(true);
    setAdminPlayerError(false);
    try {
      const res = await fetch(`/api/video-token?id=${encodeURIComponent(procedure.id)}`, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch admin preview token");
      }
      const data = await res.json();
      if (data.token) {
        setAdminToken(data.token);
      }
    } catch {
      setAdminPlayerError(true);
    } finally {
      setLoadingAdminToken(false);
    }
  }, [playbackId, procedure.id]);

  useEffect(() => {
    if (status === "ready" && playbackId) {
      fetchAdminToken();
    }
  }, [status, playbackId, fetchAdminToken]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Initial configuration and usage check
  useEffect(() => {
    let isSubscribed = true;

    // Check for inspection/screenshot state override
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const stateOverride = urlParams.get("video_state");
      if (stateOverride === "empty") {
        setStatus("none");
      } else if (stateOverride === "uploading") {
        setStatus("uploading");
        setIsUploading(true);
        setUploadPercent(45);
        setSelectedFile(new File(["demo-binary-content"], "ecg-12-lead-test.mp4", { type: "video/mp4" }));
      } else if (stateOverride === "processing") {
        setStatus("processing");
      } else if (stateOverride === "ready") {
        setStatus("ready");
        setPlaybackId("2DVqQg8Y84Zah00xlfHBTDB009TIm2xuvOchkbtDmquYQ");
        setDurationSeconds(30);
      } else if (stateOverride === "error") {
        setStatus("errored");
        setVideoError("Unable to complete video processing on Mux. Please retry.");
      } else if (stateOverride === "delete_confirm") {
        setStatus("ready");
        setPlaybackId("2DVqQg8Y84Zah00xlfHBTDB009TIm2xuvOchkbtDmquYQ");
        setDurationSeconds(30);
        setIsDeleteDialogOpen(true);
      }
    }

    Promise.all([getVideoConfigState(), getVideoUsageSummary()])
      .then(([config, usage]) => {
        if (!isSubscribed) return;
        setIsConfigured(config.isConfigured);
        setIsDemo(config.isDemo);
        setConfigLoaded(true);

        const count = usage.usedCount || 0;
        setUsageCount(count);
        // Quota is blocked if >= 10 assets used and procedure has NO current asset
        if (count >= 10 && !procedure.mux_asset_id) {
          setQuotaBlocked(true);
        }
      })
      .catch(() => {
        if (!isSubscribed) return;
        setConfigLoaded(true);
      });

    return () => {
      isSubscribed = false;
    };
  }, [procedure.mux_asset_id]);

  // 2. Automated polling interval during uploading/processing
  const runPoll = useCallback(async () => {
    if (status !== "uploading" && status !== "processing") return;
    const res = await pollVideoStatus(procedure.id);
    if (res.videoStatus) {
      setStatus(res.videoStatus);
      if (res.playbackId) setPlaybackId(res.playbackId);
      if (res.durationSeconds) setDurationSeconds(res.durationSeconds);
      if (res.videoError) setVideoError(res.videoError);

      if (res.videoStatus === "ready") {
        if (isReplacing && pendingOldAssetId) {
          await finalizeVideoReplacement(procedure.id, pendingOldAssetId);
          setIsReplacing(false);
          setPendingOldAssetId(null);
        }
        setFeedback({
          type: "success",
          message: AR_STRINGS.videoReadyTitle,
        });
        onProcedureUpdated?.({
          video_status: "ready",
          mux_playback_id: res.playbackId,
          video_duration_seconds: res.durationSeconds,
        });
      } else if (res.videoStatus === "errored") {
        setFeedback({
          type: "error",
          message: res.videoError || "Video processing failed on Mux.",
        });
      }
    }
  }, [status, procedure.id, isReplacing, pendingOldAssetId, onProcedureUpdated]);

  useEffect(() => {
    let intervalId: any = null;
    if (status === "uploading" || status === "processing") {
      intervalId = setInterval(runPoll, 3500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, runPoll]);

  // 3. Initiate Video Upload
  const handleStartUpload = async (file: File, isReplacement = false) => {
    if (!file) return;

    // Check size limit: 500 MB
    const MAX_BYTES = 500 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setFeedback({
        type: "error",
        message: "File size exceeds the maximum limit of 500 MB.",
      });
      return;
    }

    if (quotaBlocked && !isReplacement && !procedure.mux_asset_id) {
      setFeedback({
        type: "error",
        message: AR_STRINGS.videoQuotaBlocked,
      });
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadPercent(0);
    setFeedback(null);

    if (isReplacement && procedure.mux_asset_id) {
      setIsReplacing(true);
      setPendingOldAssetId(procedure.mux_asset_id);
    }

    try {
      // Step A: Request direct upload URL from server action
      const res = await requestVideoUploadUrl(procedure.id);
      if (res.error || !res.uploadUrl) {
        setIsUploading(false);
        setFeedback({
          type: "error",
          message: res.error || "Failed to obtain video upload URL.",
        });
        return;
      }

      setStatus("uploading");

      // Step B: Direct chunked upload via @mux/upchunk
      const upload = UpChunk.createUpload({
        endpoint: res.uploadUrl,
        file: file,
        chunkSize: 5120, // 5MB chunks
      });
      upChunkUploadRef.current = upload;

      upload.on("progress", (evt: any) => {
        const percent = Math.round(evt.detail);
        setUploadPercent(percent);
      });

      upload.on("success", () => {
        setIsUploading(false);
        setStatus("processing");
        setSelectedFile(null);
        setFeedback({
          type: "success",
          message: "Upload completed successfully. Processing video on Mux...",
        });
        // Immediately trigger first poll
        setTimeout(runPoll, 1000);
      });

      upload.on("error", (err: any) => {
        setIsUploading(false);
        setStatus("errored");
        setVideoError(err.detail?.message || "Connection lost during upload.");
        setFeedback({
          type: "error",
          message: "An error occurred while uploading video. Please try again.",
        });
      });
    } catch (err: any) {
      setIsUploading(false);
      setStatus("errored");
      setFeedback({
        type: "error",
        message: err.message || "Upload failed.",
      });
    }
  };

  const handleCancelUpload = () => {
    if (upChunkUploadRef.current) {
      upChunkUploadRef.current.abort();
      upChunkUploadRef.current = null;
    }
    setIsUploading(false);
    setStatus(procedure.mux_playback_id ? "ready" : "none");
    setSelectedFile(null);
    setUploadPercent(0);
    setFeedback({
      type: "error",
      message: "Upload cancelled.",
    });
  };

  // 4. Delete Procedure Video
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setFeedback(null);
    try {
      const res = await deleteProcedureVideo(procedure.id);
      if (res.error) {
        setFeedback({
          type: "error",
          message: res.error,
        });
      } else {
        setStatus("none");
        setPlaybackId(null);
        setDurationSeconds(null);
        setVideoError(null);
        setIsDeleteDialogOpen(false);
        setFeedback({
          type: "success",
          message: "Video deleted successfully from Mux and procedure.",
        });
        onProcedureUpdated?.({
          video_status: "none",
          mux_playback_id: null,
          mux_asset_id: null,
          video_duration_seconds: null,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "An unexpected error occurred while deleting video.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (totalSeconds: number | null): string => {
    if (!totalSeconds || isNaN(totalSeconds)) return "00:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!configLoaded) {
    return (
      <div className="p-8 text-center text-xs text-text-secondary animate-pulse">
        Checking Mux configuration...
      </div>
    );
  }

  // State: Demo Mode Disabled
  if (isDemo) {
    return (
      <div className="squircle-card rounded-card border border-border-subtle bg-white p-6 text-center space-y-3 shadow-card-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-light-1 text-rose-dark">
          <Video className="h-6 w-6" />
        </div>
        <h3 data-testid="video-heading-demo" className="text-[16px] sm:text-[17px] font-bold text-navy">
          {AR_STRINGS.tabVideo}
        </h3>
        <p data-testid="video-supporting-demo" className="type-caption text-[13px] sm:text-[14px] text-text-secondary max-w-md mx-auto">
          {AR_STRINGS.videoDemoModeDisabled}
        </p>
      </div>
    );
  }

  // State: Mux Not Configured
  if (!isConfigured) {
    return (
      <div className="squircle-card rounded-card border border-border-subtle bg-white p-6 space-y-4 shadow-card-soft">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-warning-surface text-warning shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 data-testid="video-heading-not-configured" className="text-[16px] sm:text-[17px] font-bold text-navy">
              {AR_STRINGS.videoMuxNotConfigured}
            </h3>
            <p data-testid="video-supporting-not-configured" className="type-caption text-[13px] sm:text-[14px] text-text-secondary">
              {AR_STRINGS.videoMuxNotConfiguredDesc}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border-subtle bg-light-1 p-3.5 text-xs text-text-secondary">
          Please configure video API credentials in production server environment variables to enable video uploads. See deployment guide for instructions.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-start">
      {/* Live Feedback Notification */}
      <div aria-live="polite">
        {feedback && (
          <div
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-start mb-2 animate-in fade-in ${
              feedback.type === "success"
                ? "border border-success/30 bg-success-surface text-success"
                : "border border-danger/30 bg-danger-surface text-danger"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Hidden File Input for Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleStartUpload(file, isReplacing);
          }
          e.target.value = "";
        }}
      />

      {/* ---------------------------------------------------------------------- */}
      {/* 1. Empty State: Drag & Drop Zone */}
      {/* ---------------------------------------------------------------------- */}
      {status === "none" && (
        <div className="space-y-4">
          {quotaBlocked && (
            <div
              role="alert"
              className="rounded-lg border border-danger/40 bg-danger-surface p-3 text-xs font-semibold text-danger flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{AR_STRINGS.videoQuotaBlocked}</span>
            </div>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleStartUpload(file, false);
            }}
            className={`squircle-tile flex flex-col items-center justify-center gap-3 rounded-tile border-2 border-dashed p-8 sm:p-12 text-center transition-colors ${
              isDraggingOver
                ? "border-rose-dark bg-light-1"
                : "border-border bg-light-1/60 hover:border-rose-dark"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-border-subtle text-rose-dark shadow-xs">
              <Upload className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h4 data-testid="video-heading-empty" className="text-[16px] sm:text-[17px] font-bold text-navy">
                {AR_STRINGS.videoEmptyDropTitle}
              </h4>
              <p data-testid="video-supporting-empty" className="type-caption text-[13px] sm:text-[14px] text-text-secondary">
                {AR_STRINGS.videoEmptyFormats}
              </p>
            </div>

            <button
              type="button"
              disabled={quotaBlocked}
              onClick={() => fileInputRef.current?.click()}
              className="squircle-pill btn-rose-cta mt-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-xs font-bold text-navy active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileVideo className="h-4 w-4" />
              <span>{AR_STRINGS.videoSelectFile}</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. Uploading State: Progress Bar & Cancel */}
      {/* ---------------------------------------------------------------------- */}
      {status === "uploading" && (
        <div className="squircle-tile rounded-tile border border-border-subtle bg-light-1 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-lg bg-white border border-border-subtle text-rose-dark shrink-0 mt-0.5 sm:mt-0">
                <Upload className="h-5 w-5 animate-bounce" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h4 data-testid="video-heading-uploading" className="text-[16px] sm:text-[17px] font-bold text-navy">
                  {AR_STRINGS.videoUploading}
                </h4>
                {selectedFile && (
                  <div className="space-y-0.5">
                    <p
                      className="type-caption text-[13px] sm:text-[14px] text-navy font-mono truncate max-w-full"
                      title={selectedFile.name}
                    >
                      <bdi dir="ltr">{selectedFile.name}</bdi>
                    </p>
                    <p data-testid="video-supporting-uploading" className="type-caption text-[13px] sm:text-[14px] text-text-secondary font-mono">
                      <bdi dir="ltr">
                        {((uploadedBytes || (uploadPercent / 100) * selectedFile.size) / (1024 * 1024)).toFixed(1)} / {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </bdi>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelUpload}
              className="squircle-pill w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-pill border border-danger/30 bg-white px-4 py-2.5 text-xs font-bold text-danger hover:bg-danger hover:text-white transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
              <span>{AR_STRINGS.videoCancelUpload}</span>
            </button>
          </div>

          {/* Progress track */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-text-secondary">
              <span>Direct upload progress:</span>
              <span className="font-mono text-navy">{uploadPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white border border-border-subtle">
              <div
                className="h-full bg-rose-dark transition-all duration-150 ease-out"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. Processing State: Spinner & Explanation */}
      {/* ---------------------------------------------------------------------- */}
      {status === "processing" && (
        <div className="squircle-tile rounded-tile border border-border-subtle bg-light-1 p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white border border-border-subtle text-rose-dark">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 data-testid="video-heading-processing" className="text-[16px] sm:text-[17px] font-bold text-navy">
              {AR_STRINGS.videoProcessing}
            </h4>
            <p data-testid="video-supporting-processing" className="type-caption text-[13px] sm:text-[14px] text-text-secondary max-w-md mx-auto">
              {AR_STRINGS.videoProcessingDesc}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={runPoll}
              className="squircle-pill inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border border-border bg-white px-4 py-2 text-xs font-bold text-navy hover:border-rose-dark hover:text-rose-dark transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{AR_STRINGS.videoRefreshStatus}</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. Ready State: Preview Player, Duration & Actions */}
      {/* ---------------------------------------------------------------------- */}
      {status === "ready" && (
        <div className="squircle-card rounded-card border border-border-subtle bg-white overflow-hidden space-y-4 p-4 sm:p-5 shadow-card-soft">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-success" />
              <h4 data-testid="video-heading-ready" className="text-[16px] sm:text-[17px] font-bold text-navy">
                {AR_STRINGS.videoReadyTitle}
              </h4>
            </div>

            <div data-testid="video-supporting-ready" className="flex items-center gap-2 type-caption text-[13px] sm:text-[14px] text-text-secondary">
              <Clock className="h-4 w-4 text-rose-dark" />
              <span>{AR_STRINGS.videoDurationLabel}</span>
              <span className="font-mono font-bold text-navy">
                {formatDuration(durationSeconds)}
              </span>
            </div>
          </div>

          {/* Video Preview Box (16:9 reserved aspect ratio, Light Theme) */}
          <div className="w-full aspect-video rounded-tile overflow-hidden bg-light-1 border border-border-subtle shadow-sm" dir="ltr" lang="en">
            {adminPlayerError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 gap-3 bg-light-1">
                <AlertCircle className="h-8 w-8 text-danger" />
                <p className="text-sm sm:text-base font-bold text-danger">
                  Unable to play video
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAdminPlayerError(false);
                    fetchAdminToken();
                  }}
                  className="squircle-pill inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-danger/40 bg-danger-surface px-4 py-2 text-xs font-bold text-danger hover:bg-danger hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : loadingAdminToken ? (
              <div className="w-full h-full flex flex-col items-center justify-center animate-pulse bg-light-1 p-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-border-subtle">
                  <Loader2 className="h-6 w-6 text-rose-dark animate-spin" />
                </div>
                <p className="text-xs text-text-secondary">
                  Loading video player...
                </p>
              </div>
            ) : playbackId && adminToken ? (
              <MuxPlayer
                playbackId={playbackId}
                metadata={{
                  video_title: procedure.title,
                }}
                tokens={{
                  playback: adminToken,
                }}
                streamType="on-demand"
                preferPlayback="mse"
                className="w-full h-full"
                style={
                  {
                    "--primary-color": "#c87475",
                    "--accent-color": "#c87475",
                    "--media-range-bar-color": "#c87475",
                  } as React.CSSProperties & Record<`--${string}`, string>
                }
                onError={(e) => {
                  console.error("Admin MuxPlayer error:", e);
                  setAdminPlayerError(true);
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary gap-2">
                <Play className="h-8 w-8 text-rose-dark" />
                <span className="text-xs font-semibold">Live preview ready</span>
              </div>
            )}
          </div>

          {/* Action Buttons: Replace & Delete */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsReplacing(true);
                fileInputRef.current?.click();
              }}
              className="squircle-pill inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border border-border bg-light-1 px-4 py-2 text-xs font-bold text-navy hover:border-rose-dark hover:text-rose-dark transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{AR_STRINGS.videoReplaceButton}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="squircle-pill inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border border-danger/30 bg-danger-surface px-4 py-2 text-xs font-bold text-danger hover:bg-danger hover:text-white transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>{AR_STRINGS.videoDeleteButton}</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 5. Error State: Alert & Retry */}
      {/* ---------------------------------------------------------------------- */}
      {status === "errored" && (
        <div className="squircle-tile rounded-tile border border-danger/40 bg-danger-surface p-5 space-y-3">
          <div className="flex items-start gap-3 text-danger">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 data-testid="video-heading-error" className="text-[16px] sm:text-[17px] font-bold">Video processing error</h4>
              <p data-testid="video-supporting-error" className="type-caption text-[13px] sm:text-[14px] text-danger">
                {videoError || "Video processing failed on Mux."}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="squircle-pill inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-danger px-4 py-2 text-xs font-bold text-white transition-transform active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Re-upload</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Delete Confirmation Modal (Rendered to body via Portal to guarantee 100% full-screen overlay) */}
      {/* ---------------------------------------------------------------------- */}
      {isDeleteDialogOpen && mounted && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-video-modal-title"
          className="surface-light fixed inset-0 z-[9999] m-0 !m-0 flex items-center justify-center bg-navy/65 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          <div className="squircle-card relative w-full max-w-md rounded-card border border-border-subtle bg-white p-6 shadow-card-soft space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 text-danger">
              <div className="p-2.5 rounded-full bg-danger-surface shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3
                  id="delete-video-modal-title"
                  className="text-[16px] sm:text-[17px] font-bold text-navy"
                >
                  {AR_STRINGS.videoDeleteConfirmTitle}
                </h3>
                <p className="mt-1 type-caption text-[13px] sm:text-[14px] text-text-secondary leading-relaxed">
                  {AR_STRINGS.videoDeleteConfirmDesc}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
              <button
                ref={cancelDeleteBtnRef}
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteDialogOpen(false)}
                className="squircle-pill inline-flex min-h-[44px] items-center justify-center rounded-pill border border-border bg-white px-4 py-2 text-xs font-bold text-navy hover:border-rose-dark hover:text-rose-dark transition-colors"
              >
                {AR_STRINGS.videoDeleteCancelButton}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="squircle-pill inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-danger px-5 py-2 text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>{AR_STRINGS.videoDeleteConfirmButton}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
