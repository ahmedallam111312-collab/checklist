import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Read credentials from .env.local safely
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
function getEnv(key: string): string {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = getEnv("SUPABASE_SECRET_KEY");
const adminEmail = getEnv("E2E_ADMIN_EMAIL") || "admin@example.com";
const adminPassword = getEnv("E2E_ADMIN_PASSWORD") || "admin123456";

const supabase = createClient(supabaseUrl, secretKey);

const BASE_URL = "http://localhost:3000";
const DOCS_DIR = path.join(process.cwd(), "docs", "screenshots");
const ARTIFACT_DIR = "C:\\Users\\IT\\.gemini\\antigravity\\brain\\f82be7e3-df8b-4a7e-98be-7c2620afe20a";
const DB_SOURCE = "DEV Database (smfsmixdymphtgfalupl)";

const TEMP_SLUG = "e2e-screenshot-probe";

async function main() {
  console.log("================================================================================");
  console.log("📸 CAPTURING ALL PHASE 5 & 6 SCREENSHOT MATRIX");
  console.log("================================================================================");

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  let tempProcId: string | null = null;
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const manifest: any[] = [];

  try {
    // 1. Seed temporary published procedure for public-procedure screenshots
    console.log("🌱 Seeding temporary procedure for screenshot capture...");
    const { data: proc } = await supabase
      .from("procedures")
      .insert({
        slug: TEMP_SLUG,
        title: "Arterial Blood Gas Sampling",
        short_description: "Standard radial artery blood gas collection protocol.",
        definition: "A diagnostic puncture of a peripheral artery to obtain arterial blood for gas analysis and acid-base assessment.",
        published: true,
        sort_order: 9999,
        video_status: "none",
        cover_alt: "ABG equipment kit",
      })
      .select("id")
      .single();

    if (proc) {
      tempProcId = proc.id;
      await supabase.from("checklist_steps").insert([
        { procedure_id: tempProcId, sort_order: 10, phase: "Preparation", text_en: "Confirm mock patient identity with two identifiers", text_ar: "تأكيد هوية المريض عبر معرّفين سريريين", is_critical: true },
        { procedure_id: tempProcId, sort_order: 20, phase: "Execution", text_en: "Perform modified Allen test to confirm collateral flow", text_ar: "إجراء اختبار ألين المعدل للتأكد من التروية الشريانية البديلة", is_critical: true },
        { procedure_id: tempProcId, sort_order: 30, phase: "Post-Procedure", text_en: "Apply firm manual pressure for at least 5 minutes", text_ar: "تطبيق ضغط يدوي مباشر لمدة 5 دقائق على الأقل", is_critical: true },
      ]);
      await supabase.from("equipment_items").insert([
        { procedure_id: tempProcId, name: "Heparinized syringe kit", sort_order: 10 },
        { procedure_id: tempProcId, name: "Chlorhexidine skin prep", sort_order: 20 },
      ]);
      await supabase.from("list_items").insert([
        { procedure_id: tempProcId, kind: "indication", text: "Evaluation of acute respiratory failure", sort_order: 10 },
        { procedure_id: tempProcId, kind: "contraindication", text: "Negative Allen test / inadequate collateral circulation", sort_order: 10 },
        { procedure_id: tempProcId, kind: "common_mistake", text: "Air bubbles left inside sample syringe", sort_order: 10 },
      ]);
    }

    const capture = async (name: string, url: string, width: number, height: number, _theme: "light", prepareFn?: (page: any) => Promise<void>) => {
      const filename = `${name}.png`;
      const docsPath = path.join(DOCS_DIR, filename);
      const artPath = path.join(ARTIFACT_DIR, filename);

      const context = await browser.newContext({
        viewport: { width, height },
        colorScheme: "light",
      });
      const page = await context.newPage();

      await page.goto(url, { waitUntil: "domcontentloaded" });

      if (prepareFn) {
        await prepareFn(page);
      }

      await page.waitForTimeout(400);

      // Disable animations and transitions for stable capture
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            transition-duration: 0s !important;
            animation-duration: 0s !important;
          }
        `,
      });

      await page.waitForTimeout(200);

      const buf = await page.screenshot({ fullPage: false });
      fs.writeFileSync(docsPath, buf);
      fs.writeFileSync(artPath, buf);

      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      manifest.push({
        filename,
        url,
        width,
        height,
        theme: _theme,
        sizeBytes: buf.length,
        sha256: hash.slice(0, 16),
        db: DB_SOURCE,
        timestamp: new Date().toISOString(),
      });
      console.log(`📸 Captured: ${filename} (${width}x${height}, light)`);

      await context.close();
    };

    // 1. Public Home
    for (const w of [320, 390, 1280]) {
      await capture(`public-home-${w}px-light`, `${BASE_URL}/home`, w, w === 320 ? 568 : w === 390 ? 844 : 800, "light");
    }

    // 2. Public About
    for (const w of [320, 390, 1280]) {
      await capture(`public-about-${w}px-light`, `${BASE_URL}/about`, w, w === 320 ? 568 : w === 390 ? 844 : 800, "light");
    }

    // 3. Public Procedure (390 & 1280 light)
    for (const w of [320, 390, 1280]) {
      await capture(`public-procedure-${w}px-light`, `${BASE_URL}/procedures/${TEMP_SLUG}`, w, w === 320 ? 568 : w === 390 ? 844 : 800, "light");
    }

    // 4. 404 Page (320, 390, 1280 light)
    await capture(`public-404-320px-light`, `${BASE_URL}/non-existent-page-404`, 320, 568, "light");
    await capture(`public-404-390px-light`, `${BASE_URL}/non-existent-page-404`, 390, 844, "light");
    await capture(`public-404-1280px-light`, `${BASE_URL}/non-existent-page-404`, 1280, 800, "light");

    // 5. 500 Page / Error Boundary
    await capture(`public-500-320px-light`, `${BASE_URL}/home?simulate_error=true`, 320, 568, "light");
    await capture(`public-500-390px-light`, `${BASE_URL}/home?simulate_error=true`, 390, 844, "light");
    await capture(`public-500-1280px-light`, `${BASE_URL}/home?simulate_error=true`, 1280, 800, "light");

    // 6. Footer Disclaimer (scrolled to footer at 320, 390, 1280 light)
    for (const w of [320, 390, 1280]) {
      await capture(`footer-disclaimer-${w}px-light`, `${BASE_URL}/home`, w, w === 320 ? 568 : w === 390 ? 844 : 800, "light", async (p) => {
        await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await p.waitForTimeout(300);
      });
    }

    // 7. Admin Dashboard, Undo Toast, Command Menu, Bottom Sheet
    // Login first
    console.log("🔑 Logging into Admin for admin screenshots...");
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`${BASE_URL}/admin/login`, { waitUntil: "domcontentloaded" });
    await adminPage.fill("#admin_email", adminEmail);
    await adminPage.fill("#admin_password", adminPassword);
    await adminPage.click("button[type='submit']");
    await adminPage.waitForTimeout(1000);

    const cookies = await adminContext.cookies();
    await adminContext.close();

    // Helper to capture authenticated page
    const captureAuth = async (name: string, url: string, width: number, height: number, theme: "light", prepareFn?: (page: any) => Promise<void>) => {
      const filename = `${name}.png`;
      const docsPath = path.join(DOCS_DIR, filename);
      const artPath = path.join(ARTIFACT_DIR, filename);

      const ctx = await browser.newContext({
        viewport: { width, height },
        colorScheme: "light",
      });
      await ctx.addCookies(cookies);
      const p = await ctx.newPage();

      await p.goto(url, { waitUntil: "domcontentloaded" });

      if (prepareFn) {
        await prepareFn(p);
      }

      await p.waitForTimeout(400);
      const buf = await p.screenshot({ fullPage: false });
      fs.writeFileSync(docsPath, buf);
      fs.writeFileSync(artPath, buf);

      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      manifest.push({
        filename,
        url,
        width,
        height,
        theme,
        sizeBytes: buf.length,
        sha256: hash.slice(0, 16),
        db: DB_SOURCE,
        timestamp: new Date().toISOString(),
      });
      console.log(`📸 Captured Auth: ${filename} (${width}x${height}, ${theme})`);

      await ctx.close();
    };

    // Admin Dashboard (390 & 1280)
    await captureAuth(`admin-dashboard-390px`, `${BASE_URL}/admin`, 390, 844, "light");
    await captureAuth(`admin-dashboard-1280px`, `${BASE_URL}/admin`, 1280, 800, "light");

    // Admin Command Menu (390 & 1280)
    await captureAuth(`admin-command-menu-390px`, `${BASE_URL}/admin`, 390, 844, "light", async (p) => {
      await p.keyboard.press("Control+k");
      await p.waitForSelector("[role='dialog']", { timeout: 3000 }).catch(() => {});
      await p.waitForTimeout(400);
    });
    await captureAuth(`admin-command-menu-1280px`, `${BASE_URL}/admin`, 1280, 800, "light", async (p) => {
      await p.keyboard.press("Control+k");
      await p.waitForSelector("[role='dialog']", { timeout: 3000 }).catch(() => {});
      await p.waitForTimeout(400);
    });

    // Admin Undo Toast (390 & 1280)
    // Navigate to procedure editor, delete a step to trigger 8s undo toast
    if (tempProcId) {
      await captureAuth(`admin-undo-toast-390px`, `${BASE_URL}/admin/procedures/${tempProcId}?tab=checklist`, 390, 844, "light", async (p) => {
        const deleteBtn = p.locator("button[title*='حذف']").first();
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();
          await p.waitForSelector("[role='status']", { timeout: 3000 }).catch(() => {});
        }
        await p.waitForTimeout(300);
      });

      await captureAuth(`admin-undo-toast-1280px`, `${BASE_URL}/admin/procedures/${tempProcId}?tab=checklist`, 1280, 800, "light", async (p) => {
        const deleteBtn = p.locator("button[title*='حذف']").first();
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();
          await p.waitForSelector("[role='status']", { timeout: 3000 }).catch(() => {});
        }
        await p.waitForTimeout(300);
      });

      // Admin Bottom Sheet on mobile (< 640px)
      await captureAuth(`admin-bottom-sheet-390px`, `${BASE_URL}/admin/procedures/${tempProcId}?tab=checklist`, 390, 844, "light", async (p) => {
        const importBtn = p.locator("button:has-text('استيراد مجمع')").first();
        if (await importBtn.isVisible()) {
          await importBtn.click();
          await p.waitForSelector("[role='dialog']", { timeout: 3000 }).catch(() => {});
        }
        await p.waitForTimeout(400);
      });

      await captureAuth(`admin-bottom-sheet-1280px`, `${BASE_URL}/admin/procedures/${tempProcId}?tab=checklist`, 1280, 800, "light", async (p) => {
        const importBtn = p.locator("button:has-text('استيراد مجمع')").first();
        if (await importBtn.isVisible()) {
          await importBtn.click();
          await p.waitForSelector("[role='dialog']", { timeout: 3000 }).catch(() => {});
        }
        await p.waitForTimeout(400);
      });
    }

    fs.writeFileSync(
      path.join(DOCS_DIR, "screenshots-manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
    console.log(`\n✅ All screenshots captured! Total: ${manifest.length}`);
  } finally {
    await browser.close();

    // Clean up temporary procedure
    if (tempProcId) {
      console.log("🧹 Cleaning up temporary screenshot procedure...");
      await supabase.from("checklist_steps").delete().eq("procedure_id", tempProcId);
      await supabase.from("equipment_items").delete().eq("procedure_id", tempProcId);
      await supabase.from("list_items").delete().eq("procedure_id", tempProcId);
      await supabase.from("procedures").delete().eq("id", tempProcId);
      console.log("✅ Screenshot procedure cleaned up.");
    }
  }
}

main().catch(console.error);
