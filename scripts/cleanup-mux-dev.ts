import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { listAllMuxAssets, deleteMuxAsset } from "../src/lib/mux/client";

loadEnvConfig(process.cwd());

async function cleanupAndVerify() {
  console.log("================================================================================");
  console.log("🧹 ITEM A: CLEANUP DEV DATABASE & MUX ASSETS");
  console.log("================================================================================\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing Supabase credentials.");
  }

  const supabase = createClient(supabaseUrl, secretKey);

  // 1. Delete any temporary/test procedures like 'e2e-video-test'
  const { data: testProcs } = await supabase
    .from("procedures")
    .select("id, slug, mux_asset_id")
    .ilike("slug", "e2e-%");

  if (testProcs && testProcs.length > 0) {
    for (const tp of testProcs) {
      console.log(`Deleting test procedure '${tp.slug}' (${tp.id})...`);
      if (tp.mux_asset_id) {
        try {
          await deleteMuxAsset(tp.mux_asset_id);
        } catch {}
      }
      await supabase.from("procedures").delete().eq("id", tp.id);
    }
  }

  // 2. Clear all procedure video columns and ensure unpublished starters
  console.log("Clearing video columns and resetting published status on all remaining procedures...");
  const { error: resetErr } = await supabase
    .from("procedures")
    .update({
      published: false,
      video_status: "none",
      mux_upload_id: null,
      mux_asset_id: null,
      mux_playback_id: null,
      video_duration_seconds: null,
      video_error: null,
      video_updated_at: new Date().toISOString(),
    })
    .neq("slug", ""); // applies to all

  if (resetErr) {
    console.error("Error resetting video columns:", resetErr);
  }

  // 3. Delete ALL Mux assets to expect 0 assets
  const allMuxAssets = await listAllMuxAssets();
  console.log(`Found ${allMuxAssets.length} Mux assets. Deleting all to reach 0...`);
  for (const asset of allMuxAssets) {
    console.log(`Deleting Mux asset: ${asset.id}...`);
    try {
      await deleteMuxAsset(asset.id);
      console.log(`Deleted ${asset.id}`);
    } catch (err: any) {
      console.error(`Failed to delete ${asset.id}:`, err.message);
    }
  }

  // Wait 2 seconds for Mux propagation
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Verify final state
  console.log("\n================================================================================");
  console.log("🔍 FINAL VERIFICATION STATE");
  console.log("================================================================================");

  const finalMuxAssets = await listAllMuxAssets();
  console.log(`Final Mux Asset Count: ${finalMuxAssets.length} (Expected: 0)`);

  const { data: finalProcedures } = await supabase
    .from("procedures")
    .select("slug, published")
    .order("created_at", { ascending: true });

  console.log(`Final DEV Procedures Count: ${finalProcedures?.length || 0} (Expected: 5 unpublished starters)`);
  console.table(finalProcedures);

  if (finalMuxAssets.length === 0 && finalProcedures?.length === 5 && finalProcedures.every((p) => !p.published)) {
    console.log("\n✅ CLEANUP COMPLETE: 0 Mux assets and 5 unpublished starters verified!");
  } else {
    console.error("\n❌ Warning: Final state does not match exact expectations.");
  }
}

cleanupAndVerify().catch((err) => {
  console.error("Cleanup script error:", err);
  process.exit(1);
});
