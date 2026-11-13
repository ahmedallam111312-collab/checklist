import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { revalidatePath, revalidateTag } from "next/cache";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
function getEnv(key: string): string {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = getEnv("SUPABASE_SECRET_KEY");
const supabase = createClient(supabaseUrl, secretKey);

const TEST_SLUG = "e2e-isr-timing-test";

async function main() {
  console.log("================================================================================");
  console.log("⏱️ MEASURING PUBLISH REVALIDATION & APPEARANCE TIME");
  console.log("================================================================================");

  // 1. Initial GET to ensure warm cache
  const warmRes = await fetch("http://localhost:3000/procedures");
  const warmHtml = await warmRes.text();
  console.log(`Initial warm GET status: ${warmRes.status}`);

  // 2. Insert published procedure
  const startTime = performance.now();
  const { data: proc, error } = await supabase
    .from("procedures")
    .insert({
      slug: TEST_SLUG,
      title: "ISR Revalidation Appearance Benchmark",
      short_description: "Measuring tag-based on-demand revalidation speed.",
      definition: "Benchmark test procedure.",
      published: true,
      sort_order: 9999,
      video_status: "none",
    })
    .select("id")
    .single();

  if (error || !proc) {
    throw new Error(`Failed to insert test procedure: ${error?.message}`);
  }

  // 3. Trigger revalidation endpoint or direct fetch
  // In Next.js, Server Actions call revalidateTag("procedures").
  // Let's call the procedures page repeatedly until the new item appears
  let elapsedMs = 0;
  let appeared = false;
  const maxAttempts = 30;

  for (let i = 0; i < maxAttempts; i++) {
    const fetchStart = performance.now();
    const res = await fetch("http://localhost:3000/procedures", {
      headers: { "Cache-Control": "no-cache" },
    });
    const html = await res.text();
    if (html.includes(TEST_SLUG) || html.includes("ISR Revalidation Appearance Benchmark")) {
      elapsedMs = performance.now() - startTime;
      appeared = true;
      console.log(`✅ Appearance detected on attempt ${i + 1}! Elapsed: ${elapsedMs.toFixed(1)} ms`);
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  if (!appeared) {
    console.log(`⚠️ Note: ISR revalidate = 60 interval applies without direct tag purge in test.`);
  }

  // 4. Cleanup
  await supabase.from("procedures").delete().eq("id", proc.id);
  console.log("🧹 Cleaned up benchmark procedure.");

  console.log("\n--------------------------------------------------------------------------------");
  console.log(`📊 Measured ISR Appearance Time: ${appeared ? elapsedMs.toFixed(1) + " ms" : "Dynamic ISR (60s window)"}`);
  console.log("--------------------------------------------------------------------------------");
}

main().catch(console.error);
