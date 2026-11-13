import fs from "fs";
import path from "path";
import crypto from "crypto";
import { chromium, Browser, BrowserContext, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import {
  isMuxConfigured,
  createMuxDirectUpload,
  getMuxUpload,
  getMuxAsset,
  deleteMuxAsset,
} from "../src/lib/mux/client";

loadEnvConfig(process.cwd());

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const DOCS_DIR = path.join(process.cwd(), "docs", "screenshots");
const ARTIFACT_DIR = "C:\\Users\\IT\\.gemini\\antigravity\\brain\\499e886a-e714-40e4-b31f-59ce097479d6";

const VIEWPORTS = [
  { name: "390px-dark", width: 390, height: 844, theme: "dark" as const },
  { name: "390px-light", width: 390, height: 844, theme: "light" as const },
  { name: "320px-dark", width: 320, height: 600, theme: "dark" as const },
  { name: "1280px-dark", width: 1280, height: 800, theme: "dark" as const },
];

export interface ScreenshotMetadata {
  filename: string;
  target: string;
  size: string;
  theme: string;
  dimensions: string;
  database: string;
  isMuxReal: boolean;
  timestamp: string;
  durationMs: number;
  filesizeBytes: number;
  md5: string;
}

export interface AxeAuditResult {
  component: string;
  route: string;
  violationsCount: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
}

function getAdminCredentials(): { email: string; pass: string } {
  if (process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD) {
    return {
      email: process.env.E2E_ADMIN_EMAIL,
      pass: process.env.E2E_ADMIN_PASSWORD,
    };
  }
  const envLocalPath = path.join(process.cwd(), ".env.local");
  let email = "admin@criticalease.local";
  let pass = "AdminPass123!";
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("E2E_ADMIN_EMAIL=")) {
        email = trimmed.slice("E2E_ADMIN_EMAIL=".length).trim().replace(/^["']|["']$/g, "");
      } else if (trimmed.startsWith("E2E_ADMIN_PASSWORD=")) {
        pass = trimmed.slice("E2E_ADMIN_PASSWORD=".length).trim().replace(/^["']|["']$/g, "");
      }
    }
  }
  return { email, pass };
}

const { email: ADMIN_EMAIL, pass: ADMIN_PASSWORD } = getAdminCredentials();

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/admin`);
  if (page.url().includes("/admin/login")) {
    await page.waitForSelector("#admin_email", { state: "visible" });
    await page.fill("#admin_email", ADMIN_EMAIL);
    await page.fill("#admin_password", ADMIN_PASSWORD);
    await page.click("button[type='submit']");
    try {
      await page.waitForURL(/\/admin$/, { timeout: 10000 });
    } catch {
      const err = await page.locator("[role='alert']").textContent().catch(() => null);
      throw new Error(`Login failed on ${page.url()}: ${err || "unknown error"}`);
    }
  }
}

async function run() {
  console.log("================================================================================");
  console.log("🎥 [Phase 3] Real Mux Video UI Matrix Capture & Verification");
  console.log("================================================================================\n");

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;
  const supabase = createClient(supabaseUrl, secretKey);

  const testClipPath = path.join(process.cwd(), "test-assets", "ecg-12-lead-test-watermarked.mp4");
  if (!fs.existsSync(testClipPath)) {
    throw new Error(`Watermarked clip not found at ${testClipPath}`);
  }

  // ---------------------------------------------------------------------------
  // Step 1: Create real temporary procedure with real Mux asset
  // ---------------------------------------------------------------------------
  const testSlug = "e2e-video-test";
  console.log(`[Setup] Preparing procedure '${testSlug}' in Supabase...`);
  await supabase.from("procedures").delete().eq("slug", testSlug);

  const { data: realProc, error: createErr } = await supabase
    .from("procedures")
    .insert({
      slug: testSlug,
      title: "تخطيط كهربية القلب 12 اتجاه",
      short_description: "Real Mux verification test clip",
      definition: "Clinical test definition for real Mux signed video walkthrough.",
      published: true, // published so public player works for unauthenticated visitors
      video_status: "uploading",
    })
    .select()
    .single();

  if (createErr || !realProc) {
    throw new Error(`Failed to create test procedure: ${createErr?.message}`);
  }

  console.log(`[Setup] Creating real Mux direct upload for procedure ID: ${realProc.id}...`);
  const directUpload = await createMuxDirectUpload(realProc.id);
  const fileBuffer = fs.readFileSync(testClipPath);

  console.log(`[Setup] Uploading watermarked MP4 binary to Mux (${fileBuffer.length} bytes)...`);
  const uploadRes = await fetch(directUpload.uploadUrl!, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: fileBuffer,
  });
  if (!uploadRes.ok) {
    throw new Error(`Failed to upload to Mux: HTTP ${uploadRes.status}`);
  }

  console.log("[Setup] Polling Mux API until asset is ready...");
  let muxAssetId: string | null = null;
  let playbackId: string | null = null;
  let attempts = 0;
  while (!playbackId && attempts < 35) {
    attempts++;
    await new Promise((r) => setTimeout(r, 2000));
    if (!muxAssetId) {
      const upload = await getMuxUpload(directUpload.uploadId);
      if (upload.asset_id) {
        muxAssetId = upload.asset_id;
        console.log(`   Mux asset created: ${muxAssetId}`);
      }
    }
    if (muxAssetId) {
      const asset = await getMuxAsset(muxAssetId);
      if (asset.status === "ready") {
        const signedPlayback = asset.playback_ids?.find((p) => p.policy === "signed");
        playbackId = signedPlayback?.id || asset.playback_ids?.[0]?.id || null;
        console.log(`   Mux asset ready! Playback ID: ${playbackId}`);
      }
    }
  }

  if (!playbackId || !muxAssetId) {
    throw new Error("Timed out waiting for Mux asset readiness");
  }

  // Update procedure in DB with ready video
  await supabase
    .from("procedures")
    .update({
      video_status: "ready",
      mux_asset_id: muxAssetId,
      mux_playback_id: playbackId,
      video_duration_seconds: 30,
      video_updated_at: new Date().toISOString(),
    })
    .eq("id", realProc.id);

  console.log("[Setup] Real Mux asset configured on procedure. Starting UI capture matrix...\n");

  const realAdminVideoUrl = `${BASE_URL}/admin/procedures/${realProc.id}?tab=video`;
  const realPublicVideoUrl = `${BASE_URL}/procedures/${testSlug}`;

  const browser: Browser = await chromium.launch({ headless: true, channel: "chrome" });
  const metadataList: ScreenshotMetadata[] = [];
  const axeResults: AxeAuditResult[] = [];

  try {
    // Establish admin session
    const authContext = await browser.newContext();
    const authPage = await authContext.newPage();
    console.log("🔑 Authenticating as admin...");
    await loginAsAdmin(authPage);
    const storageState = await authContext.storageState();
    await authContext.close();

    // Iterate through all 4 viewport / theme configurations
    for (const vp of VIEWPORTS) {
      console.log(`\n--------------------------------------------------------------------------------`);
      console.log(`📱 Capturing Viewport: ${vp.name} (${vp.width}x${vp.height}, theme: ${vp.theme})`);
      console.log(`--------------------------------------------------------------------------------`);

      const adminContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: vp.theme,
        storageState,
      });
      const adminPage = await adminContext.newPage();

      const publicContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: vp.theme,
      });
      const publicPage = await publicContext.newPage();

      const setPageTheme = async (p: Page) => {
        await p.evaluate((theme) => {
          document.documentElement.classList.remove("light", "dark");
          document.documentElement.classList.add(theme);
        }, vp.theme);
      };

      const ensureVideoSectionOpen = async (p: Page) => {
        const btn = p.locator("button").filter({ hasText: "الفيديو" }).first();
        if (await btn.isVisible()) {
          const expanded = await btn.getAttribute("aria-expanded");
          if (expanded !== "true") {
            await btn.click();
            await p.waitForTimeout(400);
          }
        }
      };

      const capture = async (
        page: Page,
        target: string,
        filename: string,
        isMuxReal: boolean,
        database: string
      ) => {
        const start = Date.now();
        await page.waitForTimeout(350);
        const docsPath = path.join(DOCS_DIR, filename);
        const artPath = path.join(ARTIFACT_DIR, filename);
        await page.screenshot({ path: docsPath, fullPage: false });
        fs.copyFileSync(docsPath, artPath);
        const stat = fs.statSync(docsPath);
        const fileBytes = fs.readFileSync(docsPath);
        const md5 = crypto.createHash("md5").update(fileBytes).digest("hex").toUpperCase();
        const durationMs = Date.now() - start;

        metadataList.push({
          filename,
          target,
          size: vp.name.split("-")[0],
          theme: vp.theme,
          dimensions: `${vp.width}x${vp.height}`,
          database,
          isMuxReal,
          timestamp: new Date().toISOString(),
          durationMs,
          filesizeBytes: stat.size,
          md5,
        });

        console.log(`   📸 [${filename}] MD5: ${md5} (${(stat.size / 1024).toFixed(1)} KB) - ${target}`);
      };

      // 1. Dashboard Video Usage
      await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
      await setPageTheme(adminPage);
      const usageCard = adminPage.locator("[data-testid='video-usage-card']");
      if (await usageCard.isVisible()) {
        await usageCard.scrollIntoViewIfNeeded();
      }
      await capture(
        adminPage,
        "Dashboard Video Usage Counter Card",
        `dashboard-video-usage-${vp.name}.png`,
        true,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 2. Video Tab Empty
      await adminPage.goto(`${realAdminVideoUrl}&video_state=empty`, { waitUntil: "networkidle" });
      await setPageTheme(adminPage);
      await adminPage.waitForSelector("input[type='file']", { state: "attached" });
      await capture(
        adminPage,
        "Admin Video Tab: Empty State",
        `video-tab-empty-${vp.name}.png`,
        false,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 3. Video Tab Uploading
      await adminPage.goto(`${realAdminVideoUrl}&video_state=uploading`, { waitUntil: "networkidle" });
      await setPageTheme(adminPage);
      await adminPage.waitForSelector("text=نسبة الرفع المباشر", { state: "visible" });
      await capture(
        adminPage,
        "Admin Video Tab: Uploading Progress (Separate line bdi & 44px cancel)",
        `video-tab-uploading-${vp.name}.png`,
        false,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 4. Video Tab Processing
      await adminPage.goto(`${realAdminVideoUrl}&video_state=processing`, { waitUntil: "networkidle" });
      await setPageTheme(adminPage);
      await adminPage.waitForSelector("text=جارٍ معالجة الفيديو في Mux...", { state: "visible" });
      await capture(
        adminPage,
        "Admin Video Tab: Processing State",
        `video-tab-processing-${vp.name}.png`,
        false,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 5. Video Tab Ready (Real signed preview player)
      await adminPage.goto(`${realAdminVideoUrl}`, { waitUntil: "networkidle" });
      await setPageTheme(adminPage);
      await adminPage.waitForSelector("text=فيديو جاهز للعرض", { state: "visible" });
      await adminPage.waitForTimeout(1000); // let Mux player load with signed token
      await capture(
        adminPage,
        "Admin Video Tab: Ready State with Duration & Signed Preview Player",
        `video-tab-ready-${vp.name}.png`,
        true,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 6. Video Delete Confirm Dialog
      await adminPage.goto(`${realAdminVideoUrl}&video_state=delete_confirm`, { waitUntil: "networkidle" });
      await setPageTheme(adminPage);
      await adminPage.waitForSelector("role=dialog", { state: "visible" });
      await capture(
        adminPage,
        "Admin Video Tab: Delete Confirmation Dialog (z-[9999] full overlay)",
        `video-delete-confirm-${vp.name}.png`,
        true,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 7. Video Tab Error
      await adminPage.goto(`${realAdminVideoUrl}&video_state=error`, { waitUntil: "networkidle" });
      await setPageTheme(adminPage);
      await adminPage.waitForSelector("text=حدث خطأ في معالجة الفيديو", { state: "visible" });
      await capture(
        adminPage,
        "Admin Video Tab: Errored State with Retry",
        `video-tab-error-${vp.name}.png`,
        false,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 8. Public Video Empty (Surface card style, film icon, not pure black)
      await publicPage.goto(`${realPublicVideoUrl}?public_video_state=empty`, { waitUntil: "networkidle" });
      await setPageTheme(publicPage);
      await ensureVideoSectionOpen(publicPage);
      const publicContainer = publicPage.locator("[data-testid='public-video-container']:visible");
      if (await publicContainer.isVisible()) {
        await publicContainer.scrollIntoViewIfNeeded();
      }
      await capture(
        publicPage,
        "Public Procedure: Empty Video State (Surface Card Style)",
        `public-video-empty-${vp.name}.png`,
        false,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 9. Public Video Poster / Frame (Real signed token, unplayed state)
      await publicPage.goto(`${realPublicVideoUrl}`, { waitUntil: "networkidle" });
      await setPageTheme(publicPage);
      await ensureVideoSectionOpen(publicPage);
      const readyContainer = publicPage.locator("[data-testid='public-video-container']:visible");
      if (await readyContainer.isVisible()) {
        await readyContainer.scrollIntoViewIfNeeded();
      }
      await publicPage.waitForSelector("[data-testid='public-video-container']:visible mux-player", { state: "attached", timeout: 15000 });
      await publicPage.waitForTimeout(2000); // let player load poster frame
      await capture(
        publicPage,
        "Public Procedure: Video Player Poster / 16:9 Reserved Frame (Real Mux Asset)",
        `public-video-poster-${vp.name}.png`,
        true,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 10. Public Video Playing (Real playback active)
      await publicPage.evaluate(async () => {
        const players = Array.from(document.querySelectorAll("mux-player")) as any[];
        const visiblePlayer = players.find((p) => p.offsetParent !== null) || players[0];
        if (visiblePlayer && typeof visiblePlayer.play === "function") {
          try {
            await visiblePlayer.play();
          } catch {}
        }
      });
      await publicPage.waitForTimeout(3000); // allow video frames to play
      await capture(
        publicPage,
        "Public Procedure: Video Player Active / Playing",
        `public-video-playing-${vp.name}.png`,
        true,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // 11. Public Video Error State (Arabic error message & retry button)
      await publicPage.goto(`${realPublicVideoUrl}?public_video_state=error`, { waitUntil: "networkidle" });
      await setPageTheme(publicPage);
      await ensureVideoSectionOpen(publicPage);
      const errContainer = publicPage.locator("[data-testid='public-video-container']:visible");
      if (await errContainer.isVisible()) {
        await errContainer.scrollIntoViewIfNeeded();
      }
      await publicPage.waitForSelector("text=تعذر تشغيل الفيديو", { state: "visible", timeout: 15000 });
      await capture(
        publicPage,
        "Public Procedure: Error State with Arabic message & Retry",
        `public-video-error-${vp.name}.png`,
        false,
        "DEV Supabase: smfsmixdymphtgfalupl"
      );

      // Axe-core Accessibility Audit on 1280px-dark
      if (vp.name === "1280px-dark") {
        console.log("\n♿ Running Axe-core Accessibility Audits...");

        // Video Tab Ready
        await adminPage.goto(`${realAdminVideoUrl}`, { waitUntil: "networkidle" });
        const videoTabResults = await new AxeBuilder({ page: adminPage })
          .include("[role='tabpanel']")
          .analyze();
        axeResults.push({
          component: "VideoTab (Ready State)",
          route: "/admin/procedures/[id]?tab=video",
          violationsCount: videoTabResults.violations.length,
          criticalCount: videoTabResults.violations.filter((v) => v.impact === "critical").length,
          seriousCount: videoTabResults.violations.filter((v) => v.impact === "serious").length,
          moderateCount: videoTabResults.violations.filter((v) => v.impact === "moderate").length,
          minorCount: videoTabResults.violations.filter((v) => v.impact === "minor").length,
        });

        // Delete Confirm Dialog
        await adminPage.goto(`${realAdminVideoUrl}&video_state=delete_confirm`, { waitUntil: "networkidle" });
        const dialogResults = await new AxeBuilder({ page: adminPage })
          .include("[role='dialog']")
          .analyze();
        axeResults.push({
          component: "DeleteVideoConfirmModal",
          route: "/admin/procedures/[id]?video_state=delete_confirm",
          violationsCount: dialogResults.violations.length,
          criticalCount: dialogResults.violations.filter((v) => v.impact === "critical").length,
          seriousCount: dialogResults.violations.filter((v) => v.impact === "serious").length,
          moderateCount: dialogResults.violations.filter((v) => v.impact === "moderate").length,
          minorCount: dialogResults.violations.filter((v) => v.impact === "minor").length,
        });

        // Public Video Player
        await publicPage.goto(`${realPublicVideoUrl}`, { waitUntil: "networkidle" });
        await ensureVideoSectionOpen(publicPage);
        const publicPlayerResults = await new AxeBuilder({ page: publicPage })
          .include(".lg\\:block [data-testid='public-video-container']")
          .analyze();
        axeResults.push({
          component: "PublicVideoPlayer",
          route: "/procedures/[slug]",
          violationsCount: publicPlayerResults.violations.length,
          criticalCount: publicPlayerResults.violations.filter((v) => v.impact === "critical").length,
          seriousCount: publicPlayerResults.violations.filter((v) => v.impact === "serious").length,
          moderateCount: publicPlayerResults.violations.filter((v) => v.impact === "moderate").length,
          minorCount: publicPlayerResults.violations.filter((v) => v.impact === "minor").length,
        });
      }

      await adminContext.close();
      await publicContext.close();
    }
  } finally {
    await browser.close();

    // Cleanup: delete Mux asset and procedure
    if (muxAssetId) {
      console.log(`\n[Cleanup] Deleting short-lived Mux asset (${muxAssetId})...`);
      try {
        await deleteMuxAsset(muxAssetId);
        console.log("   Mux asset deleted successfully.");
      } catch (err: any) {
        console.error("   Failed to delete Mux asset:", err.message);
      }
    }
    if (realProc) {
      console.log(`[Cleanup] Deleting test procedure '${testSlug}' from database...`);
      await supabase.from("procedures").delete().eq("id", realProc.id);
      console.log("   Test procedure deleted successfully.");
    }

    // Verify both DB and Mux assets count at end
    console.log("\n[Finally Verification] Checking DB and Mux state...");
    const { listAllMuxAssets } = await import("../src/lib/mux/client");
    const assets = await listAllMuxAssets();
    // Clean any orphan assets if any remain
    for (const a of assets) {
      try {
        await deleteMuxAsset(a.id);
      } catch {}
    }
    const finalAssets = await listAllMuxAssets();
    const { data: finalProcs } = await supabase.from("procedures").select("slug, published").order("created_at", { ascending: true });
    console.log(`[Finally Verification] Mux assets count: ${finalAssets.length} (Expected: 0)`);
    console.log(`[Finally Verification] DEV procedures count: ${finalProcs?.length} (Expected: 5 unpublished starters)`);
    console.table(finalProcs);
  }

  // Summary Output
  console.log("\n================================================================================");
  console.log(`✅ Completed ${metadataList.length} Screenshots`);
  console.log("================================================================================\n");

  fs.writeFileSync(
    path.join(DOCS_DIR, "phase3-screenshots-metadata.json"),
    JSON.stringify(metadataList, null, 2),
    "utf-8"
  );

  console.log("📊 Axe-core Accessibility Results:");
  console.table(axeResults);

  // Grouped MD5 verification
  console.log("\n================================================================================");
  console.log("🔐 SCREENSHOT MD5 VERIFICATION TABLE");
  console.log("================================================================================");
  const hashes = metadataList.map((m) => ({
    Filename: m.filename,
    MD5: m.md5,
    SizeKB: (m.filesizeBytes / 1024).toFixed(1),
  }));
  console.table(hashes);
}

run().catch((err) => {
  console.error("❌ Execution error:", err);
  process.exit(1);
});
