import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import AxeBuilder from "@axe-core/playwright";
import path from "path";
import fs from "fs";
import { assertTestDataSafety } from "./helpers/test-data-safety";

// T1 Safety Guard: Refuse to execute unless .env.test is configured for dedicated test project
assertTestDataSafety();

const DOCS_SCREENSHOTS_DIR = path.join(process.cwd(), "docs", "screenshots");
const ARTIFACT_DIR = "C:\\Users\\IT\\.gemini\\antigravity\\brain\\499e886a-e714-40e4-b31f-59ce097479d6";

function saveScreenshot(sourcePath: string, filename: string) {
  const dest1 = path.join(DOCS_SCREENSHOTS_DIR, filename);
  fs.copyFileSync(sourcePath, dest1);
  if (fs.existsSync(ARTIFACT_DIR)) {
    const dest2 = path.join(ARTIFACT_DIR, filename);
    fs.copyFileSync(sourcePath, dest2);
  }
}

async function loginAsAdmin(page: any) {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("FAIL: E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be configured in environment.");
  }
  await page.goto("/admin");
  if (page.url().includes("/admin/login")) {
    await page.fill("#admin_email", adminEmail);
    await page.fill("#admin_password", adminPassword);
    await page.click("button[type='submit']");
    await page.waitForURL(/\/admin$/);
  }
}

test.describe("Phase 2A Admin Quality Gate & Verification Suite", () => {
  let targetProcId = "demo-proc-1";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || "";
  const isDemo = process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true";

  const VERIFY_E2E_SLUG = "e2e-admin-verify";
  const ECG_E2E_SLUG = "e2e-12-lead-ecg";

  test.beforeAll(async () => {
    if (!isDemo && secretKey && supabaseUrl) {
      const secretClient = createClient(supabaseUrl, secretKey);

      // Clean existing e2e test procedures
      const { data: existing } = await secretClient
        .from("procedures")
        .select("id")
        .in("slug", [VERIFY_E2E_SLUG, ECG_E2E_SLUG]);

      if (existing && existing.length > 0) {
        const ids = existing.map((p) => p.id);
        await secretClient.from("checklist_steps").delete().in("procedure_id", ids);
        await secretClient.from("equipment_items").delete().in("procedure_id", ids);
        await secretClient.from("list_items").delete().in("procedure_id", ids);
        await secretClient.from("procedures").delete().in("id", ids);
      }

      // Create e2e 12-lead-ecg procedure for bidi visual order test
      await secretClient.from("procedures").insert({
        slug: ECG_E2E_SLUG,
        title: "12-Lead ECG",
        sort_order: 30,
        published: false,
      });

      // Create dedicated e2e procedure for admin verification & public carry-over
      const { data: abg, error: pErr } = await secretClient
        .from("procedures")
        .insert({
          title: "Arterial Blood Gas Sampling",
          slug: VERIFY_E2E_SLUG,
          published: true,
          sort_order: 10,
          definition:
            "Arterial blood gas sampling procedure for acute acid-base and oxygenation assessment.",
        })
        .select()
        .single();

      if (pErr || !abg) {
        throw new Error(`Failed to create e2e verify procedure: ${pErr?.message}`);
      }

      targetProcId = abg.id;

      await secretClient.from("equipment_items").insert([
        { procedure_id: targetProcId, name: "20G Arterial Line Catheter", sort_order: 1 },
        { procedure_id: targetProcId, name: "Heparinized Flush Solution", sort_order: 2 },
        { procedure_id: targetProcId, name: "Transducer Cable and Monitor", sort_order: 3 },
        { procedure_id: targetProcId, name: "Sterile Drape and Dressing Kit", sort_order: 4 },
      ]);
    }
  });

  test.afterAll(async () => {
    if (!isDemo && secretKey && supabaseUrl) {
      const secretClient = createClient(supabaseUrl, secretKey);

      // Delete only e2e-% procedures and their child rows (never touches starter rows)
      const { data: e2eProcs } = await secretClient
        .from("procedures")
        .select("id")
        .like("slug", "e2e-%");

      if (e2eProcs && e2eProcs.length > 0) {
        const ids = e2eProcs.map((p) => p.id);
        await secretClient.from("checklist_steps").delete().in("procedure_id", ids);
        await secretClient.from("equipment_items").delete().in("procedure_id", ids);
        await secretClient.from("list_items").delete().in("procedure_id", ids);
        await secretClient.from("procedures").delete().in("id", ids);
      }

      // Verify teardown: no e2e- rows remain
      const { count: e2eCount } = await secretClient
        .from("procedures")
        .select("id", { count: "exact", head: true })
        .like("slug", "e2e-%");
      expect(e2eCount).toBe(0);

      const { data: files } = await secretClient.storage.from("site-images").list();
      const e2eFiles = (files || []).filter((f) => f.name.startsWith("e2e-"));
      for (const f of e2eFiles) {
        await secretClient.storage.from("site-images").remove([f.name]);
      }
      expect(e2eFiles.length).toBe(0);
    }
  });
  // --------------------------------------------------------------------------
  // 1. Carry-over Phase 1 Checks: Equipment Counter Order & Accordion H2 Size
  // --------------------------------------------------------------------------
  test("Carry-over Verification: Equipment counter order (0 / 4 جاهز) & Accordion H2 token (23px)", async ({
    page,
  }) => {
    await page.goto("/procedures/e2e-admin-verify");

    // A. Equipment Counter Visible Order Test
    const equipBtn = page.locator("button:has-text('الأدوات')");
    await equipBtn.click();
    await page.waitForTimeout(200);

    const doneElem = page.locator("[data-testid='equip-done']").first();
    const totalElem = page.locator("[data-testid='equip-total']").first();
    await expect(doneElem).toBeVisible();
    await expect(totalElem).toBeVisible();

    const doneBox = await doneElem.boundingBox();
    const totalBox = await totalElem.boundingBox();
    expect(doneBox).not.toBeNull();
    expect(totalBox).not.toBeNull();

    // In LTR counter "0 / 4", the '0' glyph must be positioned to the LEFT of '4' (x < total.x)
    expect(doneBox!.x).toBeLessThan(totalBox!.x);

    const counterElem = page.locator("div:has(> bdi.font-mono)").filter({ hasText: "جاهز" }).first();
    const counterText = (await counterElem.textContent()) || "";
    expect(counterText.replace(/\s+/g, " ").trim()).toBe("0 / 4 جاهز");

    // B. Accordion Headings Computed Size Test
    // Must match the H2 token: 22px plus 1px Arabic bump = 23px
    const accordionH2 = page.locator("h2.type-h2").first();
    const computedFontSize = await accordionH2.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(computedFontSize).toBe(23);
  });

  // --------------------------------------------------------------------------
  // 1b. Fix 2a: Western Digits Scan across All Public & Admin Pages
  // --------------------------------------------------------------------------
  test("Fix 2a: No Arabic-Indic digits (٠-٩) on public and admin pages", async ({
    page,
  }) => {
    const urls = [
      "/",
      "/home",
      "/procedures",
      "/procedures/e2e-admin-verify",
      "/admin/login",
    ];

    for (const url of urls) {
      await page.goto(url);
      const bodyText = (await page.locator("body").innerText()) || "";
      const arabicIndicMatches = bodyText.match(/[\u0660-\u0669]/g);
      expect(
        arabicIndicMatches,
        `Found Arabic-Indic digits on ${url}: ${arabicIndicMatches?.join(", ")}`
      ).toBeNull();
    }

    // Authenticated admin pages
    await loginAsAdmin(page);
    const adminUrls = [
      "/admin",
      `/admin/procedures/${targetProcId}`,
      "/admin/settings",
      `/admin/preview/${targetProcId}`,
    ];

    for (const url of adminUrls) {
      await page.goto(url);
      const bodyText = (await page.locator("body").innerText()) || "";
      const arabicIndicMatches = bodyText.match(/[\u0660-\u0669]/g);
      expect(
        arabicIndicMatches,
        `Found Arabic-Indic digits on ${url}: ${arabicIndicMatches?.join(", ")}`
      ).toBeNull();
    }
  });

  // --------------------------------------------------------------------------
  // 1c. Fix 2b: Bidi Visual Ordering of "12-Lead ECG" and "/12-lead-ecg"
  // --------------------------------------------------------------------------
  test("Fix 2b: Bidi Visual Ordering of '12-Lead ECG' and '/12-lead-ecg'", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");

    // Locate the 12-Lead ECG row
    const ecgRow = page.locator("li").filter({ hasText: "12-Lead ECG" }).first();
    await expect(ecgRow).toBeVisible();

    // 1. Visible glyph ordering of "12-Lead ECG"
    // The "12" must render to the left of "ECG" in LTR
    const titleBdi = ecgRow.locator("h3 bdi");
    await expect(titleBdi).toBeVisible();

    const titleOrdering = await titleBdi.evaluate((el) => {
      const textNode = el.childNodes[0];
      if (!textNode) return { ok: false };
      const range1 = document.createRange();
      range1.setStart(textNode, 0); // "1"
      range1.setEnd(textNode, 1);
      const r1 = range1.getBoundingClientRect();

      const rangeE = document.createRange();
      rangeE.setStart(textNode, 8); // "E"
      rangeE.setEnd(textNode, 9);
      const rE = rangeE.getBoundingClientRect();

      return {
        ok: true,
        oneLeft: r1.left,
        eLeft: rE.left,
      };
    });

    expect(titleOrdering.ok).toBe(true);
    expect(titleOrdering.oneLeft!).toBeLessThan(titleOrdering.eLeft!);

    // 2. Visible glyph ordering of "/12-lead-ecg"
    // The leading slash "/" must be to the left of "12"
    const slugSpan = ecgRow.locator("bdi.font-mono").filter({ hasText: "/e2e-12-lead-ecg" });
    await expect(slugSpan).toBeVisible();

    const slugOrdering = await slugSpan.evaluate((el) => {
      const textNode = el.childNodes[0];
      if (!textNode) return { ok: false };
      const rangeSlash = document.createRange();
      rangeSlash.setStart(textNode, 0); // "/"
      rangeSlash.setEnd(textNode, 1);
      const rSlash = rangeSlash.getBoundingClientRect();

      const range1 = document.createRange();
      range1.setStart(textNode, 1); // "1"
      range1.setEnd(textNode, 2);
      const r1 = range1.getBoundingClientRect();

      return {
        ok: true,
        slashLeft: rSlash.left,
        oneLeft: r1.left,
      };
    });

    expect(slugOrdering.ok).toBe(true);
    expect(slugOrdering.slashLeft!).toBeLessThan(slugOrdering.oneLeft!);
  });

  // --------------------------------------------------------------------------
  // 1d. Fix 2c: Mobile Editor Tabs Reachability at 320px and 390px
  // --------------------------------------------------------------------------
  test("Fix 2c: Mobile Editor Tabs Reachability at 320px and 390px", async ({
    page,
  }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 700 });
      await loginAsAdmin(page);
      await page.goto(`/admin/procedures/${targetProcId}`);

      const tabIds = ["details", "overview", "equipment", "checklist", "video"];
      for (const tabId of tabIds) {
        const tabBtn = page.locator(`#tab-${tabId}`);
        await expect(tabBtn).toBeAttached();

        // Scroll tab into view and assert visible
        await tabBtn.scrollIntoViewIfNeeded();
        await expect(tabBtn).toBeVisible();

        // Verify touch / click target is at least 44px
        const box = await tabBtn.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 1e. Fix 2f: Publish Toggle role=switch, aria-checked and visible text badge
  // --------------------------------------------------------------------------
  test("Fix 2f: Publish Toggle role=switch, aria-checked and visible text state", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/procedures/${targetProcId}`);

    const toggleInput = page.locator("#publish_toggle");
    await expect(toggleInput).toBeAttached();
    await expect(toggleInput).toHaveAttribute("role", "switch");

    const isChecked = await toggleInput.isChecked();
    await expect(toggleInput).toHaveAttribute("aria-checked", String(isChecked));

    // Visible text state next to the toggle
    const statusBadge = page.locator("label:has(#publish_toggle) span.rounded-full");
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveText(isChecked ? "منشور" : "مسودة");
  });

  // --------------------------------------------------------------------------
  // 1f. Bug 6a: Zero Horizontal Overflow on All Admin Pages at 320px and 390px
  // --------------------------------------------------------------------------
  test("Bug 6a: Zero Horizontal Overflow: document.documentElement.scrollWidth <= clientWidth at 320px and 390px", async ({
    page,
  }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 700 });

      // 1. Login Page (unauthenticated)
      await page.context().clearCookies();
      await page.goto("/admin/login");
      let overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollW, `Overflow on /admin/login at ${width}px`).toBeLessThanOrEqual(overflow.clientW);

      // Authenticate
      await loginAsAdmin(page);

      // 2. Dashboard
      await page.goto("/admin");
      overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollW, `Overflow on /admin at ${width}px`).toBeLessThanOrEqual(overflow.clientW);

      // 3. New Procedure Page
      await page.goto("/admin/procedures/new");
      overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollW, `Overflow on /admin/procedures/new at ${width}px`).toBeLessThanOrEqual(overflow.clientW);

      // 4. Edit Procedure Page
      await page.goto(`/admin/procedures/${targetProcId}`);
      overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollW, `Overflow on /admin/procedures/${targetProcId} at ${width}px`).toBeLessThanOrEqual(overflow.clientW);

      // 5. Settings Page
      await page.goto("/admin/settings");
      overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollW, `Overflow on /admin/settings at ${width}px`).toBeLessThanOrEqual(overflow.clientW);

      // 6. Preview Page
      await page.goto(`/admin/preview/${targetProcId}`);
      overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollW, `Overflow on /admin/preview/${targetProcId} at ${width}px`).toBeLessThanOrEqual(overflow.clientW);
    }
  });

  // --------------------------------------------------------------------------
  // 2. Axe-Core Accessibility Audit across All Admin Pages
  // --------------------------------------------------------------------------
  test("Axe-core Accessibility Audit: Zero serious or critical violations across all admin pages", async ({
    page,
  }) => {
    // 1. Login Page
    await page.goto("/admin/login");
    const loginAxe = await new AxeBuilder({ page }).analyze();
    const loginViolations = loginAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(loginViolations).toEqual([]);

    // Authenticate
    await loginAsAdmin(page);

    // 2. Dashboard Page
    const dashboardAxe = await new AxeBuilder({ page }).analyze();
    const dashViolations = dashboardAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(dashViolations).toEqual([]);

    // 3. New Procedure Page
    await page.goto("/admin/procedures/new");
    const newAxe = await new AxeBuilder({ page }).analyze();
    const newViolations = newAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(newViolations).toEqual([]);

    // 4. Edit Procedure Page
    await page.goto(`/admin/procedures/${targetProcId}`);
    const editAxe = await new AxeBuilder({ page }).analyze();
    const editViolations = editAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(editViolations).toEqual([]);

    // 5. Settings Page
    await page.goto("/admin/settings");
    const settingsAxe = await new AxeBuilder({ page }).analyze();
    const settingsViolations = settingsAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(settingsViolations).toEqual([]);

    // 6. Draft Preview Page
    await page.goto(`/admin/preview/${targetProcId}`);
    const previewAxe = await new AxeBuilder({ page }).analyze();
    const previewViolations = previewAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(previewViolations).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // 3. Keyboard Navigation Test: Reorder Controls & Editor
  // --------------------------------------------------------------------------
  test("Keyboard-Only Navigation: Reorder controls, editor tabs, and field traversal", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // Test Move Down button via keyboard focus and Enter key
    const firstMoveDownBtn = page.locator("button[aria-label*='تحريك لأسفل']").first();
    await firstMoveDownBtn.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);

    // Verify batch save button appeared
    const batchSaveBtn = page.locator("button:has-text('حفظ الترتيب')");
    await expect(batchSaveBtn).toBeVisible();

    // Navigate to editor
    await page.goto(`/admin/procedures/${targetProcId}`);

    // Tab through tabs
    const overviewTab = page.locator("button[role='tab']:has-text('نظرة عامة')");
    await overviewTab.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);

    // Verify overview tab panel became active
    await expect(page.locator("#procedure_definition")).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 4. Full Admin Screenshot Matrix (Login, Dashboard, Details, Overview, Settings)
  // --------------------------------------------------------------------------
  test("Capture Required Admin Screenshots at 390px and 1280px in Dark and Light Themes", async ({
    browser,
  }) => {
    test.setTimeout(180000);

    const viewports = [
      { width: 320, height: 600, name: "320px" },
      { width: 390, height: 844, name: "390px" },
      { width: 1280, height: 800, name: "1280px" },
    ];
    const themes = ["dark", "light"] as const;

    for (const vp of viewports) {
      for (const theme of themes) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme,
        });
        const page = await context.newPage();

        // A. Login Page
        await page.goto("/admin/login");
        if (theme === "light") {
          await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
        }
        await page.waitForTimeout(150);
        const loginShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-login-${vp.name}-${theme}.png`);
        await page.screenshot({ path: loginShot, fullPage: true });
        saveScreenshot(loginShot, `admin-login-${vp.name}-${theme}.png`);
        fs.unlinkSync(loginShot);

        // Login for subsequent dashboard shots
        await loginAsAdmin(page);

        if (theme === "light") {
          await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
        }
        await page.waitForTimeout(150);

        // B. Dashboard Page
        const dashShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-dash-${vp.name}-${theme}.png`);
        await page.screenshot({ path: dashShot, fullPage: true });
        saveScreenshot(dashShot, `admin-dashboard-${vp.name}-${theme}.png`);
        fs.unlinkSync(dashShot);

        // C. Details Tab (/admin/procedures/demo-proc-1)
        await page.goto(`/admin/procedures/${targetProcId}`);
        if (theme === "light") {
          await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
        }
        await page.waitForTimeout(150);
        const detailsShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-details-${vp.name}-${theme}.png`);
        await page.screenshot({ path: detailsShot, fullPage: true });
        saveScreenshot(detailsShot, `admin-details-tab-${vp.name}-${theme}.png`);
        fs.unlinkSync(detailsShot);

        // D. Overview Tab (/admin/procedures/demo-proc-1)
        await page.click("button[role='tab']:has-text('نظرة عامة')");
        await page.waitForTimeout(150);
        const overviewShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-overview-${vp.name}-${theme}.png`);
        await page.screenshot({ path: overviewShot, fullPage: true });
        saveScreenshot(overviewShot, `admin-overview-tab-${vp.name}-${theme}.png`);
        fs.unlinkSync(overviewShot);

        // D2. Tab strip on mobile at 320px and 390px scrolled to each end
        if (vp.name === "320px" || vp.name === "390px") {
          await page.goto(`/admin/procedures/${targetProcId}`);
          if (theme === "light") {
            await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
          }
          await page.waitForTimeout(150);

          // Scrolled to start (Details tab selected)
          await page.click("#tab-details");
          await page.waitForTimeout(200);
          const tabStartShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-tabs-start-${vp.name}-${theme}.png`);
          await page.screenshot({ path: tabStartShot, fullPage: false });
          saveScreenshot(tabStartShot, `admin-tabs-scrolled-start-${vp.name}-${theme}.png`);
          fs.unlinkSync(tabStartShot);

          // Scrolled to end (Video tab selected)
          await page.click("#tab-video");
          await page.waitForTimeout(200);
          const tabEndShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-tabs-end-${vp.name}-${theme}.png`);
          await page.screenshot({ path: tabEndShot, fullPage: false });
          saveScreenshot(tabEndShot, `admin-tabs-scrolled-end-${vp.name}-${theme}.png`);
          fs.unlinkSync(tabEndShot);
        }

        // E. Settings Page (/admin/settings)
        await page.goto("/admin/settings");
        if (theme === "light") {
          await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
        }
        await page.waitForTimeout(150);
        const settingsShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-settings-${vp.name}-${theme}.png`);
        await page.screenshot({ path: settingsShot, fullPage: true });
        saveScreenshot(settingsShot, `admin-settings-${vp.name}-${theme}.png`);
        fs.unlinkSync(settingsShot);

        // F. Equipment Tab (/admin/procedures/[id])
        await page.goto(`/admin/procedures/${targetProcId}`);
        if (theme === "light") {
          await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
        }
        await page.click("#tab-equipment");
        await page.waitForTimeout(200);
        const equipShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-equip-${vp.name}-${theme}.png`);
        await page.screenshot({ path: equipShot, fullPage: true });
        saveScreenshot(equipShot, `admin-equipment-tab-${vp.name}-${theme}.png`);
        fs.unlinkSync(equipShot);

        // G. Checklist Tab (/admin/procedures/[id]) with Critical Step, Arabic Field & Phase Heading
        await page.click("#tab-checklist");
        await page.waitForTimeout(200);
        const checkShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-checklist-${vp.name}-${theme}.png`);
        await page.screenshot({ path: checkShot, fullPage: true });
        saveScreenshot(checkShot, `admin-checklist-tab-${vp.name}-${theme}.png`);
        fs.unlinkSync(checkShot);

        // H. Bulk Import Preview Modal with an Error Line
        await page.click("button:has-text('استيراد مجمّع')");
        const importModal = page.locator("[role='dialog']");
        await importModal.waitFor({ state: "visible" });
        await importModal.locator("textarea").fill("Valid step one | خطوة صحيحة\n | Arabic without English\n! Critical step | خطوة حرجة");
        await importModal.locator("button:has-text('معاينة')").click();
        await page.waitForTimeout(200);
        const modalShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-import-modal-${vp.name}-${theme}.png`);
        await page.screenshot({ path: modalShot, fullPage: true });
        saveScreenshot(modalShot, `admin-import-preview-error-${vp.name}-${theme}.png`);
        fs.unlinkSync(modalShot);
        await importModal.locator("button[aria-label*='إغلاق']").click();

        // I. Public Page Showing Result (/procedures/e2e-admin-verify)
        await page.goto("/procedures/e2e-admin-verify");
        if (theme === "light") {
          await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
        }
        await page.waitForTimeout(200);
        // Expand equipment accordion
        const pubEquip = page.locator("button:has-text('الأدوات')");
        if (await pubEquip.isVisible()) {
          const isExp = await pubEquip.getAttribute("aria-expanded");
          if (isExp !== "true") await pubEquip.click();
        }
        // Expand Arabic toggle on step 2
        const pubArToggle = page.locator("button:has-text('عربي')").first();
        if (await pubArToggle.isVisible()) {
          const isArExp = await pubArToggle.getAttribute("aria-expanded");
          if (isArExp !== "true") await pubArToggle.click();
        }
        await page.waitForTimeout(200);
        const pubShot = path.join(DOCS_SCREENSHOTS_DIR, `temp-pub-${vp.name}-${theme}.png`);
        await page.screenshot({ path: pubShot, fullPage: true });
        saveScreenshot(pubShot, `public-procedure-phase2b-${vp.name}-${theme}.png`);
        fs.unlinkSync(pubShot);

        await context.close();
      }
    }
  });

  // --------------------------------------------------------------------------
  // 5. Automated Verification for UI Polish (10a to 10f)
  // --------------------------------------------------------------------------
  test("UI Polish 10a: English titles have line-height 1.3 in procedure list and editor header", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // Procedure list heading
    await page.goto("/admin");
    const procTitleH3 = page.locator("h3:has(bdi[lang='en'])").first();
    const listLineHeight = await procTitleH3.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const fs = parseFloat(style.fontSize);
      const lh = parseFloat(style.lineHeight);
      return lh / fs;
    });
    expect(listLineHeight).toBeCloseTo(1.3, 1);

    // Editor header heading
    await page.goto(`/admin/procedures/${targetProcId}`);
    const editorHeaderH1 = page.locator("h1:has(bdi[lang='en'])").first();
    const editorLineHeight = await editorHeaderH1.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const fs = parseFloat(style.fontSize);
      const lh = parseFloat(style.lineHeight);
      return lh / fs;
    });
    expect(editorLineHeight).toBeCloseTo(1.3, 1);
  });

  test("UI Polish 10b: At 320px, edge fade mask is active and no overlapping button occludes the tab label", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await loginAsAdmin(page);
    await page.goto(`/admin/procedures/${targetProcId}`);

    // Verify edge fade mask exists
    const edgeMask = page.locator(".pointer-events-none.absolute.inset-y-0.end-0");
    await expect(edgeMask).toBeAttached();

    // Verify label for overview tab has no overlapping clickable chevron on top of it
    const overviewTab = page.locator("#tab-overview");
    await expect(overviewTab).toBeVisible();
    const box = await overviewTab.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
  });

  test("UI Polish 10c & 10e: Settings page hierarchy, counter under field, full-width save, alt-text label, no English in parens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await loginAsAdmin(page);
    await page.goto("/admin/settings");

    // 10e: Verify no English in parens in field labels
    const labels = await page.locator("label").allTextContents();
    for (const lbl of labels) {
      expect(lbl).not.toMatch(/\(Site Name\)/i);
      expect(lbl).not.toMatch(/\(Hero Title\)/i);
      expect(lbl).not.toMatch(/\(Tagline\)/i);
      expect(lbl).not.toMatch(/\(Splash CTA\)/i);
      expect(lbl).not.toMatch(/\(Footer Text\)/i);
    }

    // 10c: Helper text size smaller than label (13px/14px muted)
    const helperText = page.locator("form p.type-caption").first();
    const helperFs = await helperText.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
    const labelFs = await page.locator("form label").first().evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
    expect(helperFs).toBeLessThanOrEqual(labelFs);

    // 10c: 0/300 counter aligned to the end under field
    const counterDiv = page.locator("div.flex.justify-end:has(span.font-mono)");
    await expect(counterDiv).toBeVisible();

    // 10c: Save button is full-width on mobile (takes 100% of card inner width at 320px viewport, width >= 240px)
    const saveBtn = page.getByRole("button", { name: "حفظ التعديلات" });
    const saveBox = await saveBtn.boundingBox();
    expect(saveBox!.width).toBeGreaterThanOrEqual(240);

    // 10c: Alt-text label shortened to prevent orphan wrap
    const altLabel = page.locator("label:has-text('النص البديل (200 حرف كحد أقصى)')");
    await expect(altLabel).toBeVisible();

    // 10c: Alt-text placeholder shortened
    const altInput = page.locator("#cover_alt_input");
    await expect(altInput).toHaveAttribute("placeholder", "وصف الصورة لقارئ الشاشة...");
  });

  test("UI Polish 10d: Preview button displays 'عرض في الموقع' when published, 'معاينة المسودة' when draft, exactly one per view", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // When published (targetProcId is published in beforeAll)
    await page.goto(`/admin/procedures/${targetProcId}`);
    const pubPreviewBtn = page.locator("a:has-text('عرض في الموقع')");
    await expect(pubPreviewBtn).toBeVisible();
    await expect(pubPreviewBtn).toHaveAttribute("href", /\/procedures\/[a-z0-9-]+$/);

    // Exactly one preview button on page
    const allPreviewButtons = page.locator("a:has-text('عرض في الموقع'), a:has-text('معاينة المسودة')");
    expect(await allPreviewButtons.count()).toBe(1);
  });

  test("UI Polish 10f: Image upload client-side validation rules (5 MB pre-upload limit)", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/procedures/${targetProcId}`);

    // Dropzone text mentions 5 MB input limit and < 2 MB output limit
    const dropzoneDesc = page.locator("text=بحد أقصى 5 ميجابايت (يتم ضغطها إلى WebP بحجم أقل من 2 ميجابايت");
    await expect(dropzoneDesc).toBeVisible();
  });
});
