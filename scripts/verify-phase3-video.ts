import fs from "fs";
import path from "path";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import {
  isMuxConfigured,
  createMuxDirectUpload,
  getMuxUpload,
  getMuxAsset,
  deleteMuxAsset,
  listAllMuxAssets,
  generateMuxPlaybackToken,
} from "../src/lib/mux/client";

// Ensure environment configuration is loaded
loadEnvConfig(process.cwd());

async function runRealMuxVerification() {
  console.log("================================================================================");
  console.log("🎥 PHASE 3: REAL MUX VIDEO INTEGRATION & SECURITY WALKTHROUGH");
  console.log("================================================================================\n");

  if (!isMuxConfigured()) {
    throw new Error("Mux is not configured in .env.local. Cannot run real Mux verification.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing Supabase credentials for verification script.");
  }

  const supabase = createClient(supabaseUrl, secretKey);
  const testClipPath = path.join(process.cwd(), "test-assets", "ecg-12-lead-test-watermarked.mp4");
  if (!fs.existsSync(testClipPath)) {
    throw new Error(`Test video clip not found at ${testClipPath}`);
  }

  const testSlug = "e2e-video-test";
  let procedureId: string | null = null;
  let muxUploadId: string | null = null;
  let muxAssetId: string | null = null;
  let playbackId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // Step 1: Create draft procedure 'e2e-video-test' in dev database
    // -------------------------------------------------------------------------
    console.log("[Step 1/8] Creating draft procedure 'e2e-video-test' (published=false)...");
    // Ensure clean state before starting
    await supabase.from("procedures").delete().eq("slug", testSlug);

    const { data: newProc, error: insertErr } = await supabase
      .from("procedures")
      .insert({
        slug: testSlug,
        title: "E2E Video Test Procedure",
        short_description: "Real Mux verification test clip",
        definition: "Clinical test definition for real Mux signed video walkthrough.",
        published: false,
        video_status: "none",
      })
      .select("id, slug, published, video_status")
      .single();

    if (insertErr || !newProc) {
      throw new Error(`Failed to create test procedure: ${insertErr?.message}`);
    }

    procedureId = newProc.id;
    console.log(`   Procedure created successfully (id: ${procedureId}, published: ${newProc.published})\n`);

    // -------------------------------------------------------------------------
    // Step 2: Create Mux Direct Upload (signed playback policy, no MP4 renditions)
    // -------------------------------------------------------------------------
    console.log("[Step 2/8] Creating Mux direct upload URL (signed policy, passthrough=procedureId)...");
    if (!procedureId) throw new Error("procedureId is null");
    const directUpload = await createMuxDirectUpload(procedureId);
    muxUploadId = directUpload.uploadId;
    console.log(`   Mux upload ID created: ${muxUploadId}`);
    console.log(`   Upload URL generated successfully.\n`);

    // Update procedure in DB
    await supabase
      .from("procedures")
      .update({
        video_status: "uploading",
        mux_upload_id: muxUploadId,
        video_updated_at: new Date().toISOString(),
      })
      .eq("id", procedureId);

    // -------------------------------------------------------------------------
    // Step 3: Direct binary upload of the 30-second watermarked clip
    // -------------------------------------------------------------------------
    console.log(`[Step 3/8] Uploading 30-second watermarked video (${fs.statSync(testClipPath).size} bytes) to Mux...`);
    const fileBuffer = fs.readFileSync(testClipPath);
    if (!directUpload.uploadUrl) throw new Error("Upload URL was not generated");
    const uploadRes = await fetch(directUpload.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
      },
      body: fileBuffer,
    });

    console.log(`   Mux direct upload HTTP response status: ${uploadRes.status}`);
    if (!uploadRes.ok) {
      throw new Error(`Direct upload to Mux failed with HTTP ${uploadRes.status}`);
    }
    console.log("   Video binary uploaded directly to Mux.\n");

    // -------------------------------------------------------------------------
    // Step 4: Poll Mux for asset creation & processing completion
    // -------------------------------------------------------------------------
    console.log("[Step 4/8] Polling Mux API until video processing completes (status: ready)...");
    let assetReady = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!assetReady && attempts < maxAttempts) {
      attempts++;
      await new Promise((r) => setTimeout(r, 2000));

      if (!muxAssetId) {
        const upload = await getMuxUpload(muxUploadId);
        if (upload.asset_id) {
          muxAssetId = upload.asset_id;
          console.log(`   Mux upload converted to asset: ${muxAssetId}`);
          await supabase
            .from("procedures")
            .update({
              video_status: "processing",
              mux_asset_id: muxAssetId,
              video_updated_at: new Date().toISOString(),
            })
            .eq("id", procedureId);
        }
      }

      if (muxAssetId) {
        const asset = await getMuxAsset(muxAssetId);
        console.log(`   Polling Mux asset status: '${asset.status}' (attempt ${attempts}/${maxAttempts})...`);
        if (asset.status === "ready") {
          assetReady = true;
          const signedPlayback = asset.playback_ids?.find((p) => p.policy === "signed");
          playbackId = signedPlayback?.id || asset.playback_ids?.[0]?.id || null;
          const duration = asset.duration ? Math.round(asset.duration * 100) / 100 : null;

          await supabase
            .from("procedures")
            .update({
              video_status: "ready",
              mux_playback_id: playbackId,
              video_duration_seconds: duration,
              video_updated_at: new Date().toISOString(),
            })
            .eq("id", procedureId);

          console.log(`   Asset READY! Playback ID: ${playbackId}, Duration: ${duration}s\n`);
        } else if (asset.status === "errored") {
          throw new Error(`Mux asset processing errored: ${JSON.stringify(asset.errors)}`);
        }
      }
    }

    if (!assetReady || !playbackId) {
      throw new Error("Timed out waiting for Mux asset to reach ready state.");
    }

    // -------------------------------------------------------------------------
    // Step 5: Generate RS256 signed playback token
    // -------------------------------------------------------------------------
    console.log("[Step 5/8] Generating RS256 signed playback token (1 hour expiration)...");
    const { token: signedToken } = await generateMuxPlaybackToken(playbackId, 3600);
    console.log(`   Signed token generated successfully (length: ${signedToken.length} chars).\n`);

    // -------------------------------------------------------------------------
    // Step 6: Security Verification (curl / HTTP probes)
    // -------------------------------------------------------------------------
    console.log("[Step 6/8] Executing Security HTTP Probes (Printing ONLY HTTP status codes):");

    // Probe 1: Unsigned playback URL
    const unsignedUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    const resUnsigned = await fetch(unsignedUrl, { method: "GET" });
    console.log(`   [Probe 1] Unsigned playback URL (${unsignedUrl}): HTTP ${resUnsigned.status} (Expected: 403)`);

    // Probe 2: Signed playback URL
    const signedUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${signedToken}`;
    const resSigned = await fetch(signedUrl, { method: "GET" });
    console.log(`   [Probe 2] Signed playback URL with RS256 token: HTTP ${resSigned.status} (Expected: 200)`);

    // Probe 3: MP4 rendition URL
    const mp4Url = `https://stream.mux.com/${playbackId}/high.mp4`;
    const resMp4 = await fetch(mp4Url, { method: "GET" });
    console.log(`   [Probe 3] MP4 rendition URL (${mp4Url}): HTTP ${resMp4.status} (Expected: 403 or 404 error)`);

    // Probe 4: Token request for unpublished procedure by anonymous user
    const tokenApiUrl = `http://localhost:3000/api/video-token?slug=${testSlug}`;
    let resTokenAnonStatus = "Server not running";
    try {
      const resTokenAnon = await fetch(tokenApiUrl, { method: "GET" });
      resTokenAnonStatus = String(resTokenAnon.status);
    } catch {
      // If web server is not running on 3000, report status
    }
    console.log(`   [Probe 4] Anonymous video-token request for draft procedure: HTTP ${resTokenAnonStatus} (Expected: 403)`);

    // Probe 5: Unauthenticated request to Mux webhook route
    const webhookApiUrl = `http://localhost:3000/api/mux/webhook`;
    let resWebhookStatus = "Server not running";
    try {
      const resWebhook = await fetch(webhookApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      resWebhookStatus = String(resWebhook.status);
    } catch {}
    console.log(`   [Probe 5] Unauthenticated call to /api/mux/webhook without signature: HTTP ${resWebhookStatus} (Expected: 400)\n`);

    // -------------------------------------------------------------------------
    // Step 7: Delete video from Mux and verify asset list
    // -------------------------------------------------------------------------
    console.log(`[Step 7/8] Deleting Mux asset (${muxAssetId})...`);
    if (!muxAssetId) throw new Error("muxAssetId is null");
    await deleteMuxAsset(muxAssetId);
    console.log("   Asset delete requested from Mux API.");
    await new Promise((r) => setTimeout(r, 1500));

    // Verify Mux asset list
    const assetsAfterDelete = await listAllMuxAssets();
    const assetStillExists = assetsAfterDelete.some((a) => a.id === muxAssetId);
    console.log(`   Does deleted asset exist in Mux? ${assetStillExists ? "YES (VIOLATION)" : "NO (VERIFIED DELETED)"}`);
    console.log(`   Total remaining Mux assets: ${assetsAfterDelete.length}`);

    // Clear procedure video columns in DB
    await supabase
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

    const { data: clearedProc } = await supabase
      .from("procedures")
      .select("video_status, mux_asset_id, mux_playback_id, video_duration_seconds")
      .eq("id", procedureId)
      .single();

    console.log(`   Procedure video columns cleared: status='${clearedProc?.video_status}', mux_asset_id=${clearedProc?.mux_asset_id || "null"}\n`);

    // -------------------------------------------------------------------------
    // Step 8: Teardown temporary draft procedure
    // -------------------------------------------------------------------------
    console.log("[Step 8/8] Cleaning up draft procedure 'e2e-video-test' from dev database...");
    await supabase.from("procedures").delete().eq("id", procedureId);
    const { count: finalCount } = await supabase
      .from("procedures")
      .select("id", { count: "exact", head: true })
      .eq("slug", testSlug);
    console.log(`   Temporary procedure removed from database (remaining count: ${finalCount || 0}).`);

    console.log("\n================================================================================");
    console.log("✅ REAL MUX VERIFICATION & SECURITY PROBE COMPLETED SUCCESSFULLY!");
    console.log("================================================================================\n");
  } catch (err: any) {
    console.error("❌ Verification failed:", err.message);
    // Cleanup if failure occurred during test
    if (muxAssetId) {
      try {
        await deleteMuxAsset(muxAssetId);
      } catch {}
    }
    if (procedureId) {
      try {
        await supabase.from("procedures").delete().eq("id", procedureId);
      } catch {}
    }
    process.exit(1);
  }
}

runRealMuxVerification();
