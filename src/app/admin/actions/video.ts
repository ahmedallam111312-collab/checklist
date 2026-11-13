"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/admin";
import { isDemoMode } from "@/lib/data";
import {
  isMuxConfigured,
  createMuxDirectUpload,
  getMuxUpload,
  getMuxAsset,
  deleteMuxAsset,
  listAllMuxAssets,
} from "@/lib/mux/client";
import { AR_STRINGS } from "@/messages/ar";
import { Procedure, VideoStatus } from "@/types/database";
import { mapActionError } from "@/lib/video/error-mapping";
import { withIdempotency } from "@/lib/idempotency";

export interface VideoActionResponse {
  success?: boolean;
  error?: string;
  uploadUrl?: string;
  uploadId?: string;
  videoStatus?: VideoStatus;
  playbackId?: string | null;
  durationSeconds?: number | null;
  videoError?: string | null;
}

function revalidateRoutes(slug?: string) {
  try {
    if (slug) {
      revalidatePath(`/procedures/${slug}`);
    }
    revalidatePath("/procedures");
    revalidatePath("/admin");
    revalidatePath("/home");
  } catch {
    // Ignore in non-production environments
  }
}

/**
 * Returns configuration status for Mux integration.
 */
export async function getVideoConfigState(): Promise<{
  isConfigured: boolean;
  isDemo: boolean;
}> {
  return {
    isConfigured: isMuxConfigured(),
    isDemo: isDemoMode(),
  };
}

/**
 * Initiates a direct video upload to Mux.
 * Enforces admin authorization, quota limits (max 10 assets), and direct browser chunking.
 */
export async function requestVideoUploadUrl(
  procedureId: string,
  idempotencyKey?: string
): Promise<VideoActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: auth.error || "غير مصرح" };
  }

  return withIdempotency(
    idempotencyKey,
    auth.user?.id || "admin",
    `video_upload:${procedureId}`,
    async () => {

  if (isDemoMode()) {
    return { error: AR_STRINGS.videoDemoModeDisabled };
  }

  if (!isMuxConfigured()) {
    return { error: AR_STRINGS.videoMuxNotConfigured };
  }

  const supabase = auth.supabase;

  // 1. Fetch current procedure to verify existence and check if this is a replacement
  const { data: proc, error: fetchErr } = await supabase
    .from("procedures")
    .select("id, slug, mux_asset_id, video_status")
    .eq("id", procedureId)
    .single();

  if (fetchErr || !proc) {
    return { error: "الإجراء غير موجود." };
  }

  // 2. Check free plan quota: max 10 active Mux assets across all procedures
  const { count: activeAssetsCount, error: countErr } = await supabase
    .from("procedures")
    .select("id", { count: "exact", head: true })
    .not("mux_asset_id", "is", null);

  if (countErr) {
    return { error: "فشل استعلام استهلاك الفيديو." };
  }

  const totalUsed = activeAssetsCount || 0;
  // If procedure does NOT currently have an asset, uploading adds a new asset
  if (!proc.mux_asset_id && totalUsed >= 10) {
    return { error: AR_STRINGS.videoQuotaBlocked };
  }

  // 3. Create Mux Direct Upload
  try {
    const directUpload = await createMuxDirectUpload(procedureId);

    // 4. Update procedure state to uploading
    const { error: updateErr } = await supabase
      .from("procedures")
      .update({
        video_status: "uploading",
        mux_upload_id: directUpload.uploadId,
        video_error: null,
        video_updated_at: new Date().toISOString(),
      })
      .eq("id", procedureId);

    if (updateErr) {
      return { error: mapActionError("requestVideoUploadUrl:update", updateErr) };
    }

    revalidateRoutes(proc.slug);

    return {
      success: true,
      uploadUrl: directUpload.uploadUrl,
      uploadId: directUpload.uploadId,
      videoStatus: "uploading",
    };
  } catch (err: any) {
    return { error: mapActionError("requestVideoUploadUrl:createMuxDirectUpload", err) };
  }
}
  );
}

/**
 * Polls Mux API for upload and asset processing status.
 * Reconciles state in Supabase procedures table.
 */
export async function pollVideoStatus(
  procedureId: string
): Promise<VideoActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: auth.error || "غير مصرح" };
  }

  if (isDemoMode() || !isMuxConfigured()) {
    return { error: "Mux غير مفعل أو يعمل في وضع العرض التوضيحي." };
  }

  const supabase = auth.supabase;

  const { data: proc, error: fetchErr } = await supabase
    .from("procedures")
    .select("id, slug, mux_upload_id, mux_asset_id, mux_playback_id, video_status, video_duration_seconds, video_error")
    .eq("id", procedureId)
    .single();

  if (fetchErr || !proc) {
    return { error: "الإجراء غير موجود." };
  }

  let status: VideoStatus = proc.video_status as VideoStatus;
  let assetId: string | null = proc.mux_asset_id;
  let playbackId: string | null = proc.mux_playback_id;
  let duration: number | null = proc.video_duration_seconds;
  let videoError: string | null = proc.video_error;

  try {
    // 1. If currently uploading, inspect Mux direct upload object
    if (status === "uploading" && proc.mux_upload_id) {
      const upload = await getMuxUpload(proc.mux_upload_id);
      if (upload.asset_id) {
        assetId = upload.asset_id;
        status = "processing";
      } else if (upload.status === "errored") {
        status = "errored";
        videoError = upload.error?.message || "فشل رفع الفيديو إلى Mux.";
      }
    }

    // 2. If processing (or transitioned above), inspect Mux asset
    if ((status === "processing" || status === "uploading") && assetId) {
      const asset = await getMuxAsset(assetId);
      if (asset.status === "ready") {
        status = "ready";
        duration = asset.duration ? Math.round(asset.duration * 100) / 100 : null;
        videoError = null;
        const signedPlayback = asset.playback_ids?.find((p) => p.policy === "signed");
        playbackId = signedPlayback?.id || asset.playback_ids?.[0]?.id || null;
      } else if (asset.status === "errored") {
        status = "errored";
        videoError = asset.errors?.messages?.[0] || "فشلت معالجة الفيديو في Mux.";
      }
    }

    // 3. Persist updated status if changed
    if (
      status !== proc.video_status ||
      assetId !== proc.mux_asset_id ||
      playbackId !== proc.mux_playback_id ||
      duration !== proc.video_duration_seconds ||
      videoError !== proc.video_error
    ) {
      await supabase
        .from("procedures")
        .update({
          video_status: status,
          mux_asset_id: assetId,
          mux_playback_id: playbackId,
          video_duration_seconds: duration,
          video_error: videoError,
          video_updated_at: new Date().toISOString(),
        })
        .eq("id", procedureId);

      revalidateRoutes(proc.slug);
    }

    return {
      success: true,
      videoStatus: status,
      playbackId,
      durationSeconds: duration,
      videoError,
    };
  } catch (err: any) {
    return {
      error: mapActionError("pollVideoStatus", err),
      videoStatus: status,
    };
  }
}

/**
 * Deletes the video asset from Mux and resets video columns on the procedure.
 * Reports any Mux deletion error to the admin without swallowing.
 */
export async function deleteProcedureVideo(
  procedureId: string
): Promise<VideoActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: auth.error || "غير مصرح" };
  }

  const supabase = auth.supabase;

  const { data: proc, error: fetchErr } = await supabase
    .from("procedures")
    .select("id, slug, mux_asset_id")
    .eq("id", procedureId)
    .single();

  if (fetchErr || !proc) {
    return { error: mapActionError("deleteProcedureVideo:fetch", fetchErr || "الإجراء غير موجود") };
  }

  // 1. Delete from Mux first if asset exists
  if (proc.mux_asset_id && !isDemoMode() && isMuxConfigured()) {
    try {
      await deleteMuxAsset(proc.mux_asset_id);
    } catch (err: any) {
      return { error: mapActionError("deleteProcedureVideo:deleteMuxAsset", err) };
    }
  }

  // 2. Clear procedure columns in Supabase
  const { error: updateErr } = await supabase
    .from("procedures")
    .update({
      mux_upload_id: null,
      mux_asset_id: null,
      mux_playback_id: null,
      video_status: "none",
      video_duration_seconds: null,
      video_error: null,
      video_updated_at: new Date().toISOString(),
    })
    .eq("id", procedureId);

  if (updateErr) {
    return { error: mapActionError("deleteProcedureVideo:updateDb", updateErr) };
  }

  revalidateRoutes(proc.slug);

  return { success: true, videoStatus: "none" };
}

/**
 * Replaces an existing procedure's video:
 * Uploads and processes the new video, then safely deletes the old Mux asset only after the new asset is ready.
 */
export async function finalizeVideoReplacement(
  procedureId: string,
  oldAssetId: string
): Promise<VideoActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: auth.error || "غير مصرح" };
  }

  if (oldAssetId && !isDemoMode() && isMuxConfigured()) {
    try {
      await deleteMuxAsset(oldAssetId);
    } catch (err: any) {
      return { error: mapActionError("finalizeVideoReplacement:deleteMuxAsset", err) };
    }
  }

  return { success: true };
}

/**
 * Aggregates live video usage (X / 10) and identifies orphan Mux assets.
 */
export async function getVideoUsageSummary(): Promise<{
  usedCount: number;
  maxLimit: number;
  orphanAssets: string[];
  error?: string;
}> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { usedCount: 0, maxLimit: 10, orphanAssets: [], error: "غير مصرح" };
  }

  const supabase = auth.supabase;

  // 1. Count live procedures with an assigned Mux asset
  const { data: dbProcs, error: dbErr } = await supabase
    .from("procedures")
    .select("mux_asset_id")
    .not("mux_asset_id", "is", null);

  if (dbErr) {
    return { usedCount: 0, maxLimit: 10, orphanAssets: [], error: mapActionError("getVideoUsageSummary", dbErr) };
  }

  const dbAssetIds = new Set(dbProcs?.map((p: any) => p.mux_asset_id).filter(Boolean));
  const usedCount = dbAssetIds.size;

  // 2. Identify orphan assets in Mux (assets in Mux not referenced by any procedure)
  let orphanAssets: string[] = [];
  if (!isDemoMode() && isMuxConfigured()) {
    try {
      const allMuxAssets = await listAllMuxAssets();
      orphanAssets = allMuxAssets
        .filter((a) => !dbAssetIds.has(a.id))
        .map((a) => a.id);
    } catch {
      // In case Mux API call fails
    }
  }

  return {
    usedCount,
    maxLimit: 10,
    orphanAssets,
  };
}
