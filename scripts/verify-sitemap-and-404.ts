import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { compareDevFingerprints, captureDevFingerprint } from "../tests/support/dev-fingerprint";

loadEnvConfig(process.cwd());

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

async function main() {
  console.log("================================================================================");
  console.log("🔍 SITEMAP & UNPUBLISHED 404 VERIFICATION");
  console.log("================================================================================\n");

  const supabase = createClient(supabaseUrl, secretKey);

  const pubSlug = "e2e-sitemap-published-probe";
  const draftSlug = "e2e-sitemap-draft-probe";

  let createdIds: string[] = [];

  try {
    console.log("[1/4] Inserting temporary published & draft procedures into DEV...");
    const { data: pubData, error: pubErr } = await supabase
      .from("procedures")
      .insert({
        slug: pubSlug,
        title: "E2E Sitemap Published Probe",
        published: true,
        sort_order: 999,
        video_status: "none",
      })
      .select("id")
      .single();

    if (pubErr) throw pubErr;
    createdIds.push(pubData.id);

    const { data: draftData, error: draftErr } = await supabase
      .from("procedures")
      .insert({
        slug: draftSlug,
        title: "E2E Sitemap Draft Probe",
        published: false,
        sort_order: 1000,
        video_status: "none",
      })
      .select("id")
      .single();

    if (draftErr) throw draftErr;
    createdIds.push(draftData.id);

    console.log(`  Created published probe: ${pubSlug} (${pubData.id})`);
    console.log(`  Created draft probe:     ${draftSlug} (${draftData.id})`);

    // Allow cache revalidation
    await new Promise((r) => setTimeout(r, 1000));

    // [2/4] Fetch and verify sitemap.xml
    console.log(`\n[2/4] Fetching ${baseUrl}/sitemap.xml...`);
    const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
    if (!sitemapRes.ok) {
      throw new Error(`Failed to fetch sitemap: HTTP ${sitemapRes.status}`);
    }

    const sitemapXml = await sitemapRes.text();
    console.log(`  Sitemap received (${sitemapXml.length} bytes).`);

    const hasPub = sitemapXml.includes(`/procedures/${pubSlug}`);
    const hasDraft = sitemapXml.includes(`/procedures/${draftSlug}`);
    const hasAbg = sitemapXml.includes("/procedures/abg-sampling");

    console.log(`  Published probe in sitemap: ${hasPub ? "✅ YES (PASS)" : "❌ NO (FAIL)"}`);
    console.log(`  Draft probe in sitemap:     ${!hasDraft ? "✅ NO (PASS)" : "❌ YES (FAIL: Leaked)"}`);
    console.log(`  Unpublished 'abg-sampling': ${!hasAbg ? "✅ NO (PASS)" : "❌ YES (FAIL: Leaked)"}`);

    if (!hasPub || hasDraft || hasAbg) {
      throw new Error("Sitemap filtering invariant failed: draft procedures appeared in sitemap.xml");
    }

    // [3/4] Verify unpublished returns 404
    console.log(`\n[3/4] Testing public HTTP routes for published vs unpublished...`);
    const pubPageRes = await fetch(`${baseUrl}/procedures/${pubSlug}`);
    console.log(`  GET /procedures/${pubSlug} -> HTTP ${pubPageRes.status} (Expected: 200)`);
    if (pubPageRes.status !== 200) {
      throw new Error(`Expected HTTP 200 for published procedure, got ${pubPageRes.status}`);
    }

    const draftPageRes = await fetch(`${baseUrl}/procedures/${draftSlug}`);
    console.log(`  GET /procedures/${draftSlug} -> HTTP ${draftPageRes.status} (Expected: 404)`);
    if (draftPageRes.status !== 404) {
      throw new Error(`Expected HTTP 404 for draft procedure, got ${draftPageRes.status}`);
    }

    console.log("\n✅ [VERIFICATION PASS] Sitemap and 404 invariants verified successfully!");
  } finally {
    console.log("\n[4/4] Cleaning up temporary probe procedures and verifying DEV baseline...");
    for (const id of createdIds) {
      await supabase.from("procedures").delete().eq("id", id);
    }

    // Verify DEV baseline restored
    const { data: remainingProcs } = await supabase
      .from("procedures")
      .select("slug, published")
      .order("created_at", { ascending: true });

    console.log(`  Remaining procedures count: ${remainingProcs?.length} (Expected: 5 unpublished starters)`);
    console.table(remainingProcs);

    if (
      remainingProcs?.length === 5 &&
      remainingProcs.every((p) => !p.published && !p.slug.startsWith("e2e-"))
    ) {
      console.log("  ✅ DEV baseline confirmed: 5 unpublished starters, 0 test records.");
    } else {
      console.error("  ❌ DEV baseline discrepancy detected!");
    }
  }
}

main().catch((err) => {
  console.error("Verification failed:", err.message);
  process.exit(1);
});
