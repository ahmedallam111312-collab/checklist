import fs from "fs";
import path from "path";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { chromium, Page, BrowserContext } from "playwright";
import {
  captureDevFingerprint,
  compareDevFingerprints,
} from "d:/checklists/tests/support/dev-fingerprint";

loadEnvConfig(process.cwd());

const BASE_URL = "http://127.0.0.1:3000";
const ARTIFACT_DIRS = [
  "D:/checklists/docs/screenshots",
  "C:/Users/IT/.gemini/antigravity/brain/02d0d068-7aca-4947-b736-df0206d0d0f0",
  "C:/Users/IT/.gemini/antigravity/brain/f82be7e3-df8b-4a7e-98be-7c2620afe20a",
  "C:/Users/IT/.gemini/antigravity/brain/57a8a860-fce2-456f-9e82-733239fb2819"
];
for (const dir of ARTIFACT_DIRS) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
const REF_DIR = "d:/checklists/docs/referance";
const TEST_SLUG = "e2e-visual-test";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;
const adminEmail = process.env.E2E_ADMIN_EMAIL || "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "";

function shot(name: string) {
  return path.join("D:/checklists/docs/screenshots", name);
}

function syncArtifacts(name: string) {
  const src = shot(name);
  if (!fs.existsSync(src)) return;
  const content = fs.readFileSync(src);
  for (const dir of ARTIFACT_DIRS) {
    const dest = path.join(dir, name);
    if (dest !== src) {
      try {
        fs.writeFileSync(dest, content);
      } catch {}
    }
  }
}

async function measurePageQuality(page: Page, label: string) {
  return page.evaluate((lbl) => {
    const overflowX =
      document.documentElement.scrollWidth > window.innerWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const innerWidth = window.innerWidth;

    const pEls = Array.from(document.querySelectorAll("main p, main li"));
    const smallArabicBody = pEls
      .filter((el) => {
        const text = (el.textContent || "").trim();
        return /[\u0600-\u06FF]/.test(text) && el.getBoundingClientRect().height > 0;
      })
      .map((el) => {
        const fsPx = parseFloat(getComputedStyle(el).fontSize);
        return {
          text: (el.textContent || "").trim().slice(0, 30),
          fontSize: fsPx,
        };
      })
      .filter((x) => x.fontSize < 16);

    const interactiveEls = Array.from(
      document.querySelectorAll("a, button, input, select, textarea, [role='button'], [role='tab']")
    );
    const smallTargets: Array<{ tag: string; text: string; w: number; h: number }> = [];
    for (const el of interactiveEls) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.width < 44 || rect.height < 44) {
        smallTargets.push({
          tag: el.tagName.toLowerCase(),
          text: (el.getAttribute("aria-label") || el.textContent || "")
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 32),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    }

    const textSample = (document.body.innerText || "");
    const forbiddenHits: string[] = [];
    for (const term of ["ProfNurse", "Prof Nurse", "profnurse", "PLACEHOLDER", "+ Photo", "Demonstration content only"]) {
      if (textSample.includes(term)) forbiddenHits.push(term);
    }

    return {
      label: lbl,
      innerWidth,
      scrollWidth,
      overflowX,
      smallArabicBody,
      smallTargetsCount: smallTargets.length,
      smallTargets: smallTargets.slice(0, 10),
      forbiddenHits,
    };
  }, label);
}

async function seedTempProcedure(supabase: any): Promise<string> {
  // Delete stale if any
  const { data: existing } = await supabase
    .from("procedures")
    .select("id")
    .eq("slug", TEST_SLUG)
    .maybeSingle();
  if (existing?.id) {
    await supabase.from("checklist_steps").delete().eq("procedure_id", existing.id);
    await supabase.from("equipment_items").delete().eq("procedure_id", existing.id);
    await supabase.from("list_items").delete().eq("procedure_id", existing.id);
    await supabase.from("procedures").delete().eq("id", existing.id);
  }

  const { data: proc, error: procErr } = await supabase
    .from("procedures")
    .insert({
      slug: TEST_SLUG,
      title: "Endotracheal Suctioning",
      short_description:
        "Clear airway secretions safely in intubated patients.",
      definition:
        "Endotracheal suctioning removes accumulated secretions from an artificial airway to maintain patency, optimize oxygenation, and prevent ventilator-associated complications.",
      published: true,
      sort_order: 999,
      video_status: "none",
      cover_path: null,
      cover_alt: "Endotracheal suctioning clinical procedure",
    })
    .select("id")
    .single();

  if (procErr || !proc) {
    throw new Error(`Failed to seed procedure: ${procErr?.message}`);
  }

  const pid = proc.id;

  await supabase.from("list_items").insert([
    {
      procedure_id: pid,
      kind: "indication",
      sort_order: 10,
      text: "Visible secretions in the endotracheal tube or coarse breath sounds on auscultation.",
    },
    {
      procedure_id: pid,
      kind: "indication",
      sort_order: 20,
      text: "Increased peak inspiratory pressure or unexplained drop in SpO2.",
    },
    {
      procedure_id: pid,
      kind: "contraindication",
      sort_order: 10,
      text: "Routine scheduled suctioning without clinical assessment indicators.",
    },
    {
      procedure_id: pid,
      kind: "contraindication",
      sort_order: 20,
      text: "Severe refractory hypoxemia unless closed-system inline suctioning is used carefully.",
    },
    {
      procedure_id: pid,
      kind: "common_mistake",
      sort_order: 10,
      text: "Applying suction continuously for more than 10-15 seconds per pass.",
    },
    {
      procedure_id: pid,
      kind: "common_mistake",
      sort_order: 20,
      text: "Instilling normal saline routinely prior to suctioning without clinical order.",
    },
  ]);

  const { error: eqErr } = await supabase.from("equipment_items").insert([
    {
      procedure_id: pid,
      sort_order: 10,
      name: "Sterile inline or open suction catheter (1x)",
    },
    {
      procedure_id: pid,
      sort_order: 20,
      name: "Wall suction regulator & collection canister (1x)",
    },
  ]);
  if (eqErr) throw new Error(`Failed seeding equipment_items: ${eqErr.message}`);

  const { error: stepErr } = await supabase.from("checklist_steps").insert([
    {
      procedure_id: pid,
      sort_order: 10,
      phase: "Pre-Procedure",
      is_critical: false,
      text_en: "Verify suction regulator pressure between 80 and 120 mmHg and perform hand hygiene.",
      text_ar: "تحقق من ضبط ضغط جهاز الشفط بين 80 و120 ملم زئبق مع غسل اليدين.",
    },
    {
      procedure_id: pid,
      sort_order: 20,
      phase: "Pre-Procedure",
      is_critical: true,
      text_en: "Pre-oxygenate the patient with 100% FiO2 for 30-60 seconds before disconnecting circuit.",
      text_ar: "أعطِ المريض أكسجين بنسبة 100% لمدة 30 إلى 60 ثانية قبل الشفط.",
    },
    {
      procedure_id: pid,
      sort_order: 30,
      phase: "Suctioning",
      is_critical: true,
      text_en: "Insert catheter gently without suction until resistance is met, then apply intermittent suction while withdrawing for <= 10-15 seconds.",
      text_ar: "أدخل القسطرة برفق دون شفط ثم اسحب بحركة دائرية مع الشفط المتقطع لمدة لا تتجاوز 15 ثانية.",
    },
    {
      procedure_id: pid,
      sort_order: 40,
      phase: "Post-Procedure",
      is_critical: false,
      text_en: "Reassess SpO2, heart rate, and breath sounds after recovery.",
      text_ar: "أعد تقييم تشبع الأكسجين ومعدل النبض وأصوات التنفس بعد الإجراء.",
    },
  ]);
  if (stepErr) throw new Error(`Failed seeding checklist_steps: ${stepErr.message}`);

  return pid;
}

async function buildSideBySideImage(
  page: Page,
  refImageFile: string,
  oursImageFile: string,
  outFile: string,
  title: string
) {
  const refB64 = fs.readFileSync(path.join(REF_DIR, refImageFile)).toString("base64");
  const oursB64 = fs.readFileSync(shot(oursImageFile)).toString("base64");

  await page.setViewportSize({ width: 920, height: 1050 });
  await page.setContent(`
    <!doctype html>
    <html dir="ltr">
      <head>
        <meta charset="utf-8" />
        <style>
          body { margin: 0; padding: 24px; background: #f3f4f6; font-family: system-ui, sans-serif; color: #0B2146; }
          h1 { font-size: 16px; margin: 0 0 16px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
          .col { background: #fff; border: 1px solid #d1d5db; border-radius: 14px; padding: 12px; }
          .cap { font-size: 12px; font-weight: 700; margin-bottom: 10px; color: #0B2146; }
          img { width: 100%; height: auto; display: block; border-radius: 10px; border: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="grid">
          <div class="col">
            <div class="cap">Client Reference: docs/referance/${refImageFile} (LTR 702px)</div>
            <img src="data:image/jpeg;base64,${refB64}" />
          </div>
          <div class="col">
            <div class="cap">Critical Ease Build: 390 CSS px RTL (DEV DB + temp ${TEST_SLUG})</div>
            <img src="data:image/png;base64,${oursB64}" />
          </div>
        </div>
      </body>
    </html>
  `);
  await page.waitForTimeout(150);
  await page.screenshot({ path: shot(outFile), fullPage: true });
}

async function main() {
  if (!supabaseUrl || !secretKey || !adminEmail || !adminPassword) {
    throw new Error("Required env config missing (values not printed).");
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const beforeFp = await captureDevFingerprint();
  console.log("BEFORE_FP:", JSON.stringify(beforeFp));

  const cspViolations: Array<{ url: string; directive: string; blocked: string }> = [];
  const consoleErrors: Array<{ url: string; msg: string }> = [];
  const pageErrors: Array<{ url: string; msg: string }> = [];
  const qualityReports: any[] = [];
  const heroFrameMetrics: any[] = [];
  const heroEndParity: any[] = [];

  const chromiumExe = path.join(
    process.env.LOCALAPPDATA || "",
    "ms-playwright",
    "chromium-1254",
    "chrome-win64",
    "chrome.exe"
  );
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromiumExe) ? chromiumExe : undefined,
    channel: fs.existsSync(chromiumExe) ? undefined : "chrome",
  });
  let tempProcId: string | null = null;

  const attachMonitors = async (page: Page) => {
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e: SecurityPolicyViolationEvent) => {
        (window as any).__cspViolations = (window as any).__cspViolations || [];
        (window as any).__cspViolations.push({
          url: window.location.pathname,
          directive: e.violatedDirective,
          blocked: e.blockedURI,
          sourceFile: e.sourceFile,
          lineNumber: e.lineNumber,
          sample: e.sample,
        });
      });
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Ignore deliberate 404 resource log on /nonexistent-404
        if (!page.url().includes("nonexistent-404")) {
          consoleErrors.push({ url: page.url(), msg: text });
        }
      }
    });
    page.on("pageerror", (err) => {
      pageErrors.push({ url: page.url(), msg: err.message });
    });
  };

  try {
    const context = await browser.newContext({
      locale: "ar",
      colorScheme: "light",
    });
    const page = await context.newPage();
    page.on("dialog", (dialog) => dialog.accept());
    await attachMonitors(page);

    // 1. Capture Empty State on /procedures BEFORE seeding
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/procedures`, { waitUntil: "networkidle" });
    await page.screenshot({ path: shot("public-procedures-empty-390px-light.png") });

    // 2. Seed temporary procedure
    tempProcId = await seedTempProcedure(supabase);

    // 3. Log in to Admin FIRST so we can capture Admin AND trigger revalidatePath("/home") so /home count reflects DB
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });
    await page.screenshot({ path: shot("admin-login-390px-light.png") });
    qualityReports.push(await measurePageQuality(page, "admin-login-390"));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });
    await page.screenshot({ path: shot("admin-login-1280px-light.png") });
    qualityReports.push(await measurePageQuality(page, "admin-login-1280"));

    await page.fill("#admin_email", adminEmail);
    await page.fill("#admin_password", adminPassword);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.includes("/admin/login"), { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState("networkidle");

    // Admin Dashboard (390 & 1280)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    await page.screenshot({ path: shot("admin-dashboard-390px-light.png") });
    qualityReports.push(await measurePageQuality(page, "admin-dashboard-390"));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    await page.screenshot({ path: shot("admin-dashboard-1280px-light.png") });
    qualityReports.push(await measurePageQuality(page, "admin-dashboard-1280"));

    // Delete Procedure Confirm Modal (capture, then cancel!)
    const delBtn = page.getByRole("button", { name: `حذف الإجراء: Endotracheal Suctioning` });
    if (await delBtn.count()) {
      await delBtn.click();
      await page.waitForTimeout(250);
      await page.screenshot({ path: shot("admin-delete-dialog-1280px-light.png") });
      await page.getByRole("button", { name: "إلغاء" }).click();
      await page.waitForTimeout(150);
    }

    // Command Menu (Ctrl+K)
    await page.keyboard.press("Control+KeyK");
    await page.waitForTimeout(250);
    await page.screenshot({ path: shot("admin-command-menu-1280px-light.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);

    // Admin Settings (390 & 1280)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: "networkidle" });
    await page.screenshot({ path: shot("admin-settings-390px-light.png") });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: "networkidle" });
    await page.screenshot({ path: shot("admin-settings-1280px-light.png") });
    qualityReports.push(await measurePageQuality(page, "admin-settings-1280"));

    // Admin Procedure Editor Tabs on tempProcId
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/admin/procedures/${tempProcId}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: shot("admin-editor-details-390px-light.png") });

    // Edit #short_desc + save once on Details tab so revalidatePath('/home') updates home count!
    await page.fill("#short_desc", "Clear airway secretions safely in intubated ICU patients.");
    const detailsSave = page.getByRole("button", { name: /حفظ/ }).first();
    if (await detailsSave.isEnabled()) {
      await detailsSave.click();
      await page.waitForTimeout(1000);
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/admin/procedures/${tempProcId}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: shot("admin-editor-details-1280px-light.png") });

    // Overview Tab
    await page.locator("#tab-overview").click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot("admin-editor-overview-1280px-light.png") });

    // Equipment Tab
    await page.locator("#tab-equipment").click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot("admin-editor-equipment-1280px-light.png") });

    // Checklist Tab (1280 + 390 + Undo Toast + Import Dialog + Mobile BottomSheet)
    await page.locator("#tab-checklist").click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot("admin-editor-checklist-1280px-light.png") });

    // Undo Toast (delete step 1 in draft, capture toast, then undo!)
    const deleteStepBtn = page.getByRole("button", { name: "حذف الخطوة 1" });
    await deleteStepBtn.click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: shot("admin-undo-toast-1280px-light.png") });
    await page.getByRole("button", { name: /تراجع/ }).click();
    await page.waitForTimeout(200);

    // Import modal (Desktop 1280)
    await page.getByRole("button", { name: /استيراد مجمّع/ }).click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: shot("admin-import-dialog-1280px-light.png") });
    const closeImportDesktop = page.getByRole("button", { name: /إغلاق/ }).first();
    if (await closeImportDesktop.count()) await closeImportDesktop.click();
    else await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Checklist + Import BottomSheet (Mobile 390)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot("admin-editor-checklist-390px-light.png") });
    await page.getByRole("button", { name: /استيراد مجمّع/ }).click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: shot("admin-import-sheet-390px-light.png") });
    const closeImportMobile = page.getByRole("button", { name: /إغلاق/ }).first();
    if (await closeImportMobile.count()) await closeImportMobile.click();
    else await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Video Tab (1280)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator("#tab-video").click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: shot("admin-editor-video-1280px-light.png") });

    // 4. PUBLIC PAGES (clean unauthenticated public context!)
    const pubContext = await browser.newContext({
      locale: "ar",
      colorScheme: "light",
    });
    const pubPage = await pubContext.newPage();
    await attachMonitors(pubPage);

    const viewports = [
      { w: 320, h: 568 },
      { w: 390, h: 844 },
      { w: 1280, h: 800 },
    ];

    for (const vp of viewports) {
      await pubPage.setViewportSize({ width: vp.w, height: vp.h });

      // Cover /
      await pubPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await pubPage.screenshot({ path: shot(`public-cover-${vp.w}px-light.png`) });
      qualityReports.push(await measurePageQuality(pubPage, `cover-${vp.w}`));

      // Home /home
      await pubPage.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
      await pubPage.screenshot({ path: shot(`public-home-${vp.w}px-light.png`) });
      qualityReports.push(await measurePageQuality(pubPage, `home-${vp.w}`));

      // Mobile menu drawer on 320 and 390
      if (vp.w < 768) {
        const menuBtn = pubPage.getByRole("button", { name: /القائمة|فتح القائمة/i }).first();
        if (await menuBtn.count()) {
          await menuBtn.click();
          await pubPage.waitForTimeout(250);
          await pubPage.screenshot({ path: shot(`public-mobile-menu-${vp.w}px-light.png`) });
          const closeBtn = pubPage.getByRole("button", { name: /إغلاق القائمة/i });
          if (await closeBtn.count()) await closeBtn.last().click();
          await pubPage.waitForTimeout(200);
        }
      }

      // Footer capture at 390 & 1280
      if (vp.w >= 390) {
        await pubPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await pubPage.waitForTimeout(300);
        await pubPage.screenshot({ path: shot(`public-footer-${vp.w}px-light.png`) });
      }

      // About /about
      await pubPage.goto(`${BASE_URL}/about`, { waitUntil: "networkidle" });
      await pubPage.screenshot({ path: shot(`public-about-${vp.w}px-light.png`) });
      qualityReports.push(await measurePageQuality(pubPage, `about-${vp.w}`));

      // Procedures List /procedures
      await pubPage.goto(`${BASE_URL}/procedures`, { waitUntil: "networkidle" });
      await pubPage.screenshot({ path: shot(`public-procedures-${vp.w}px-light.png`) });
      qualityReports.push(await measurePageQuality(pubPage, `procedures-${vp.w}`));

      // Procedure Detail /procedures/e2e-visual-test (collapsed default)
      await pubPage.goto(`${BASE_URL}/procedures/${TEST_SLUG}`, { waitUntil: "networkidle" });
      await pubPage.screenshot({ path: shot(`public-procedure-top-${vp.w}px-light.png`) });
      qualityReports.push(await measurePageQuality(pubPage, `procedure-top-${vp.w}`));

      // Expand ALL 7 sections deterministically + toggle first Arabic translation + verify critical step
      for (let sec = 1; sec <= 7; sec++) {
        const secBtn = pubPage.locator(`[data-testid="accordion-section-${sec}"] > button`);
        if ((await secBtn.getAttribute("aria-expanded")) === "false") {
          await secBtn.click();
          await pubPage.waitForTimeout(160);
        }
      }
      // Toggle Arabic translation on first step inside Section 5 content (not the accordion trigger!)
      const arToggles = pubPage.locator('[data-testid="accordion-section-5"] > div button[aria-controls]');
      if (await arToggles.count()) {
        await arToggles.first().click();
        await pubPage.waitForTimeout(150);
      }
      await pubPage.evaluate(() => window.scrollTo(0, 0));
      await pubPage.waitForTimeout(250);
      await pubPage.screenshot({
        path: shot(`public-procedure-all-open-${vp.w}px-light.png`),
        fullPage: true,
      });
      qualityReports.push(await measurePageQuality(pubPage, `procedure-all-open-${vp.w}`));

      // Verify #checklist hash deep link at 390
      if (vp.w === 390) {
        await pubPage.goto(`${BASE_URL}/procedures/${TEST_SLUG}#checklist`, { waitUntil: "networkidle" });
        await pubPage.waitForTimeout(200);
        const hashExpanded = await pubPage
          .locator('[data-testid="accordion-section-5"] > button')
          .getAttribute("aria-expanded");
        console.log("HASH_DEEPLINK_CHECKLIST_EXPANDED:", hashExpanded);
      }

      // 404
      await pubPage.goto(`${BASE_URL}/nonexistent-404`, { waitUntil: "networkidle" });
      await pubPage.screenshot({ path: shot(`public-404-${vp.w}px-light.png`) });
      qualityReports.push(await measurePageQuality(pubPage, `404-${vp.w}`));
    }

    // Search normalization test on /procedures
    await pubPage.setViewportSize({ width: 390, height: 844 });
    await pubPage.goto(`${BASE_URL}/procedures`, { waitUntil: "networkidle" });
    const searchInput = pubPage.locator('input[type="search"], input[placeholder*="ابحث"]');
    await searchInput.fill("SUCTION");
    await pubPage.waitForTimeout(150);
    const searchEnCount = await pubPage.locator('a[href="/procedures/e2e-visual-test"]').count();
    await searchInput.fill("غيرموجود123");
    await pubPage.waitForTimeout(150);
    const searchNoneCount = await pubPage.locator('a[href="/procedures/e2e-visual-test"]').count();
    console.log("SEARCH_TEST:", JSON.stringify({ searchEnCount, searchNoneCount }));

    // Offline indicator banner capture at 390
    await pubPage.goto(`${BASE_URL}/procedures/${TEST_SLUG}`, { waitUntil: "networkidle" });
    await pubContext.setOffline(true);
    await pubPage.evaluate(() => window.dispatchEvent(new Event("offline")));
    await pubPage.waitForTimeout(250);
    await pubPage.screenshot({ path: shot("public-offline-390px-light.png") });
    await pubContext.setOffline(false);
    await pubPage.evaluate(() => window.dispatchEvent(new Event("online")));

    // 5. HERO PIN FRAMES (0/25/50/75/100%) at 390 and 1280 + End-Position Parity (320/390/1280/1920)
    for (const hv of [{ w: 390, h: 844 }, { w: 1280, h: 800 }]) {
      await pubPage.setViewportSize({ width: hv.w, height: hv.h });
      await pubPage.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
      await pubPage.waitForTimeout(600); // Allow ScrollTrigger dynamic import & layout settle

      const pinInfo = await pubPage.evaluate(() => {
        const spacer = document.querySelector(".pin-spacer") as HTMLElement | null;
        const container = document.querySelector('[data-testid="hero-scroll-container"]') as HTMLElement | null;
        const stage = document.querySelector('[data-testid="hero-3d-stage"]') as HTMLElement | null;
        const colRect = stage?.parentElement?.getBoundingClientRect();
        const stageRect = stage?.getBoundingClientRect();
        const startY = container ? container.getBoundingClientRect().top + window.scrollY : 0;
        const spacerH = spacer ? spacer.getBoundingClientRect().height : 0;
        const innerH = container ? container.offsetHeight : 0;
        const pinPx = spacer ? Math.max(0, spacerH - (spacer.firstElementChild as HTMLElement)?.offsetHeight || 0) : 0;
        return {
          startY: Math.round(startY),
          spacerH: Math.round(spacerH),
          innerH: Math.round(innerH),
          pinPx: Math.round(pinPx),
          pinScreens: +(pinPx / window.innerHeight).toFixed(2),
          stageWidthPctOfCol: colRect && stageRect ? +((stageRect.width / colRect.width) * 100).toFixed(1) : null,
          stageCenterDeltaY: colRect && stageRect ? Math.round((stageRect.top + stageRect.height / 2) - (colRect.top + colRect.height / 2)) : null,
        };
      });

      const scrollDist = pinInfo.pinPx > 0 ? pinInfo.pinPx : hv.h;
      for (const pct of [0, 25, 50, 75, 100]) {
        const targetY = Math.round(pinInfo.startY + (scrollDist * pct) / 100);
        await pubPage.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }), targetY);
        await pubPage.waitForTimeout(350);

        const metrics = await pubPage.evaluate(() => {
          const pathEl = document.querySelector('[data-testid="hero-ecg-path"]') as SVGPathElement | null;
          const stage = document.querySelector('[data-testid="hero-3d-stage"]') as HTMLElement | null;
          const colRect = stage?.parentElement?.getBoundingClientRect();
          const stageRect = stage?.getBoundingClientRect();
          const cardEl = stage?.firstElementChild as HTMLElement | null;
          const hrEl = document.querySelector('[data-testid="hero-ecg-path"]') ? Array.from(document.querySelectorAll('[data-testid="hero-3d-stage"] .tabular-nums')).map(e => (e.textContent || "").trim()) : [];
          return {
            scrollY: Math.round(window.scrollY),
            dashoffset: pathEl ? Math.round(parseFloat(getComputedStyle(pathEl).strokeDashoffset || pathEl.style.strokeDashoffset || "0") * 10) / 10 : null,
            cardTransform: cardEl ? getComputedStyle(cardEl).transform : null,
            vitals: hrEl,
            stageWidthPctOfCol: colRect && stageRect ? +((stageRect.width / colRect.width) * 100).toFixed(1) : null,
            stageCenterDeltaY: colRect && stageRect ? Math.round((stageRect.top + stageRect.height / 2) - (colRect.top + colRect.height / 2)) : null,
          };
        });

        heroFrameMetrics.push({ viewport: `${hv.w}x${hv.h}`, pct, pinDistPx: scrollDist, pinScreens: pinInfo.pinScreens, ...metrics });
        await pubPage.screenshot({ path: shot(`hero-frame-${hv.w}-${pct}.png`) });
      }
    }

    // End-position parity table (320, 390, 1280, 1920)
    const paritySizes = [
      { w: 320, h: 568 },
      { w: 390, h: 844 },
      { w: 1280, h: 800 },
      { w: 1920, h: 1080 },
    ];
    for (const sz of paritySizes) {
      await pubPage.setViewportSize({ width: sz.w, height: sz.h });
      for (const mode of ["scroll_100", "reduced-motion", "lite"] as const) {
        const q = mode === "scroll_100" ? "?scroll_percent=100" : `?mode=${mode}`;
        await pubPage.goto(`${BASE_URL}/home${q}`, { waitUntil: "networkidle" });
        await pubPage.waitForTimeout(450);
        const endData = await pubPage.evaluate(() => {
          const pathEl = document.querySelector('[data-testid="hero-ecg-path"]') as SVGPathElement | null;
          const stage = document.querySelector('[data-testid="hero-3d-stage"]') as HTMLElement | null;
          const colRect = stage?.parentElement?.getBoundingClientRect();
          const stageRect = stage?.getBoundingClientRect();
          const cardEl = stage?.firstElementChild as HTMLElement | null;
          const leadEl = Array.from(document.querySelectorAll('[data-testid="hero-3d-stage"] *')).find(el => (el.textContent || "").trim() === "LEAD II") as HTMLElement | undefined;
          const leadRect = leadEl?.getBoundingClientRect();
          const vitals = Array.from(document.querySelectorAll('[data-testid="hero-3d-stage"] .tabular-nums')).map(e => (e.textContent || "").trim());
          return {
            dashoffset: pathEl ? Math.round(parseFloat(getComputedStyle(pathEl).strokeDashoffset || pathEl.style.strokeDashoffset || "0") * 10) / 10 : null,
            cardTransform: cardEl ? getComputedStyle(cardEl).transform : null,
            stageWidthPctOfCol: colRect && stageRect ? +((stageRect.width / colRect.width) * 100).toFixed(1) : null,
            stageCenterDeltaY: colRect && stageRect ? Math.round((stageRect.top + stageRect.height / 2) - (colRect.top + colRect.height / 2)) : null,
            leadIIFontPx: leadEl ? parseFloat(getComputedStyle(leadEl).fontSize) : null,
            leadIIVisible: !!(leadRect && leadRect.width > 0 && leadRect.height > 0),
            vitals,
          };
        });
        heroEndParity.push({ viewport: `${sz.w}x${sz.h}`, mode, ...endData });
      }
    }

    // 6. Side-by-Side Comparison PNGs (390 CSS px vs docs/referance/01..04.jpg)
    const compPage = await pubContext.newPage();
    await buildSideBySideImage(compPage, "01-cover.jpg", "public-cover-390px-light.png", "compare-01-cover-390.png", "01 Cover Comparison (Reference vs Critical Ease 390px)");
    await buildSideBySideImage(compPage, "02-home.jpg", "public-home-390px-light.png", "compare-02-home-390.png", "02 Home Comparison (Reference vs Critical Ease 390px)");
    await buildSideBySideImage(compPage, "03-procedures-list.jpg", "public-procedures-390px-light.png", "compare-03-procedures-390.png", "03 Procedures List Comparison (Reference vs Critical Ease 390px)");
    await buildSideBySideImage(compPage, "04-procedure-page.jpg", "public-procedure-top-390px-light.png", "compare-04-procedure-390.png", "04 Procedure Detail Comparison (Reference vs Critical Ease 390px)");

    // Collect CSP violations observed
    const v1 = await page.evaluate(() => (window as any).__cspViolations || []);
    const v2 = await pubPage.evaluate(() => (window as any).__cspViolations || []);
    cspViolations.push(...v1, ...v2);

    // Sync all generated screenshots to all artifact directories
    const shotFiles = fs.readdirSync("D:/checklists/docs/screenshots");
    for (const f of shotFiles) {
      if (f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".json")) {
        syncArtifacts(f);
      }
    }

    console.log("QUALITY_REPORTS:", JSON.stringify(qualityReports, null, 2));
    console.log("HERO_FRAMES:", JSON.stringify(heroFrameMetrics, null, 2));
    console.log("HERO_END_PARITY:", JSON.stringify(heroEndParity, null, 2));
    console.log("CSP_VIOLATIONS:", JSON.stringify(cspViolations));
    console.log("CONSOLE_ERRORS:", JSON.stringify(consoleErrors));
    console.log("PAGE_ERRORS:", JSON.stringify(pageErrors));
  } finally {
    await browser.close();

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (tempProcId) {
          await supabase.from("checklist_steps").delete().eq("procedure_id", tempProcId);
          await supabase.from("equipment_items").delete().eq("procedure_id", tempProcId);
          await supabase.from("list_items").delete().eq("procedure_id", tempProcId);
          await supabase.from("procedures").delete().eq("id", tempProcId);
        } else {
          const { data: leftover } = await supabase
            .from("procedures")
            .select("id")
            .eq("slug", TEST_SLUG)
            .maybeSingle();
          if (leftover?.id) {
            await supabase.from("checklist_steps").delete().eq("procedure_id", leftover.id);
            await supabase.from("equipment_items").delete().eq("procedure_id", leftover.id);
            await supabase.from("list_items").delete().eq("procedure_id", leftover.id);
            await supabase.from("procedures").delete().eq("id", leftover.id);
          }
        }
        break;
      } catch (err: any) {
        console.warn(`[Cleanup attempt ${attempt}/3] ${err.message}`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    let afterFp: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        afterFp = await captureDevFingerprint();
        break;
      } catch (err: any) {
        console.warn(`[Fingerprint attempt ${attempt}/3] ${err.message}`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    if (!afterFp) {
      throw new Error("Failed to capture DEV fingerprint after 3 attempts");
    }

    const cmp = compareDevFingerprints(beforeFp, afterFp);
    console.log("DEV_FINGERPRINT_COMPARE:", JSON.stringify(cmp));
    if (!cmp.matches) {
      throw new Error(`DEV DB cleanup incomplete: ${cmp.diffs.join("; ")}`);
    }
  }
}

main().catch((err) => {
  console.error("VISUAL_VERIFY_FATAL:", err);
  process.exit(1);
});
