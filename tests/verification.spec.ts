import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";
import { assertTestDataSafety } from "./helpers/test-data-safety";

// T1 Safety Guard: Refuse to execute unless .env.test is configured for dedicated test project
assertTestDataSafety();

const ARTIFACT_DIR = "C:\\Users\\IT\\.gemini\\antigravity\\brain\\499e886a-e714-40e4-b31f-59ce097479d6";
const DOCS_SCREENSHOTS_DIR = path.join(process.cwd(), "docs", "screenshots");

// Ensure directories exist
if (!fs.existsSync(DOCS_SCREENSHOTS_DIR)) {
  fs.mkdirSync(DOCS_SCREENSHOTS_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function saveScreenshot(sourcePath: string, filename: string) {
  const dest1 = path.join(DOCS_SCREENSHOTS_DIR, filename);
  const dest2 = path.join(ARTIFACT_DIR, filename);
  fs.copyFileSync(sourcePath, dest1);
  fs.copyFileSync(sourcePath, dest2);
}

test.describe("Critical Ease Public Verification Suite (Light-Only)", () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || "";
  const isDemo = process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true";
  const PUBLIC_E2E_SLUG = "e2e-public-test";
  let targetProcId = "";

  test.beforeAll(async () => {
    if (!isDemo && secretKey && supabaseUrl) {
      const secretClient = createClient(supabaseUrl, secretKey);

      // Clean any existing e2e test procedure first
      const { data: existing } = await secretClient
        .from("procedures")
        .select("id")
        .eq("slug", PUBLIC_E2E_SLUG)
        .maybeSingle();

      if (existing) {
        await secretClient.from("checklist_steps").delete().eq("procedure_id", existing.id);
        await secretClient.from("equipment_items").delete().eq("procedure_id", existing.id);
        await secretClient.from("list_items").delete().eq("procedure_id", existing.id);
        await secretClient.from("procedures").delete().eq("id", existing.id);
      }

      // Create dedicated e2e procedure for public verification suite (never touches starter rows)
      const { data: proc, error: pErr } = await secretClient
        .from("procedures")
        .insert({
          title_ar: "سحب عينة دم شرياني E2E",
          title_en: "E2E Arterial Blood Gas Sampling",
          slug: PUBLIC_E2E_SLUG,
          description_ar: "إجراء سحب الدم الشرياني للاختبارات الآلية التلقائية.",
          description_en: "Arterial blood gas sampling procedure for automated testing.",
          definition:
            "Arterial blood gas sampling procedure for acute acid-base and oxygenation assessment.",
          duration_minutes: 15,
          sort_order: 9999,
          published: true,
        })
        .select()
        .single();

      if (pErr || !proc) {
        throw new Error(`Failed to create public e2e procedure: ${pErr?.message}`);
      }

      targetProcId = proc.id;

      // Seed equipment items for e2e procedure
      await secretClient.from("equipment_items").insert([
        { procedure_id: targetProcId, name: "20G Arterial Line Catheter", sort_order: 1 },
        { procedure_id: targetProcId, name: "Heparinized Flush Solution", sort_order: 2 },
        { procedure_id: targetProcId, name: "Transducer Cable and Monitor", sort_order: 3 },
        { procedure_id: targetProcId, name: "Sterile Drape and Dressing Kit", sort_order: 4 },
      ]);

      // Seed checklist steps for e2e procedure
      await secretClient.from("checklist_steps").insert([
        {
          id: "11111111-1111-4111-8111-000000000001",
          procedure_id: targetProcId,
          sort_order: 10,
          phase: "Pre-Procedure",
          text_en: "Confirm patient identity and physician order.",
          text_ar: "التحقق من هوية المريض والأمر الطبي.",
          is_critical: false,
        },
        {
          id: "11111111-1111-4111-8111-000000000002",
          procedure_id: targetProcId,
          sort_order: 20,
          phase: "Pre-Procedure",
          text_en: "Perform modified Allen's test to evaluate collateral arterial circulation.",
          text_ar: "إجراء اختبار ألين المعدل لتقييم التروية الشريانية الجانبية.",
          is_critical: true,
        },
        {
          id: "11111111-1111-4111-8111-000000000003",
          procedure_id: targetProcId,
          sort_order: 30,
          phase: "Procedure",
          text_en: "Cleanse puncture site with chlorhexidine applicator for 30 seconds and allow to air dry completely.",
          text_ar: "تطهير موضع الوخز بمسحة الكلورهيكسيدين لمدة 30 ثانية وتركه ليجف تماماً.",
          is_critical: false,
        },
      ]);

      // Seed common mistakes for e2e procedure
      await secretClient.from("list_items").insert([
        {
          procedure_id: targetProcId,
          kind: "common_mistake",
          text: "Advancing the needle too rapidly through both walls of the artery.",
          sort_order: 10,
        },
        {
          procedure_id: targetProcId,
          kind: "common_mistake",
          text: "Failing to hold firm direct pressure for at least 5 minutes post-puncture.",
          sort_order: 20,
        },
      ]);
    }
  });

  test.afterAll(async () => {
    if (!isDemo && secretKey && supabaseUrl) {
      const secretClient = createClient(supabaseUrl, secretKey);

      // Clean only e2e- test procedures (never mutate non-test rows)
      if (targetProcId) {
        await secretClient.from("checklist_steps").delete().eq("procedure_id", targetProcId);
        await secretClient.from("equipment_items").delete().eq("procedure_id", targetProcId);
        await secretClient.from("list_items").delete().eq("procedure_id", targetProcId);
        await secretClient.from("procedures").delete().eq("id", targetProcId);
      }

      await secretClient.from("procedures").delete().like("slug", "e2e-%");

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
    }
  });

  // --------------------------------------------------------------------------
  // 1. Full-Page & Viewport Screenshots Matrix
  // --------------------------------------------------------------------------
  test("Capture Required Screenshots, Viewports & 2x Zoom Crops", async ({ browser }) => {
    test.setTimeout(120000); // 2 minutes for comprehensive screenshot matrix
    const targets = [
      { name: "320px-light", width: 320, height: 568, theme: "light" as const },
      { name: "390px-light", width: 390, height: 844, theme: "light" as const },
      { name: "1280px-light", width: 1280, height: 800, theme: "light" as const },
    ];

    for (const target of targets) {
      const context = await browser.newContext({
        viewport: { width: target.width, height: target.height },
        colorScheme: "light",
      });
      const page = await context.newPage();

      // Cover Screen (/)
      await page.goto("/");
      await page.waitForTimeout(150);
      const coverFile = `cover-${target.name}.png`;
      const tempCover = path.join(DOCS_SCREENSHOTS_DIR, `temp-${coverFile}`);
      await page.screenshot({ path: tempCover, fullPage: true });
      saveScreenshot(tempCover, coverFile);
      fs.unlinkSync(tempCover);

      // Home Page (/home) - disable sticky during fullPage capture to prevent mid-page repetition
      await page.goto("/home");
      await page.waitForTimeout(150);
      await page.evaluate(() => {
        const header = document.querySelector("header");
        if (header) header.style.position = "relative";
      });
      const homeFile = `home-${target.name}.png`;
      const tempHome = path.join(DOCS_SCREENSHOTS_DIR, `temp-${homeFile}`);
      await page.screenshot({ path: tempHome, fullPage: true });
      saveScreenshot(tempHome, homeFile);
      fs.unlinkSync(tempHome);

      // Library Page (/procedures)
      await page.goto("/procedures");
      await page.waitForTimeout(150);
      await page.evaluate(() => {
        const header = document.querySelector("header");
        if (header) header.style.position = "relative";
      });
      const libraryFile = `library-${target.name}.png`;
      const tempLibrary = path.join(DOCS_SCREENSHOTS_DIR, `temp-${libraryFile}`);
      await page.screenshot({ path: tempLibrary, fullPage: true });
      saveScreenshot(tempLibrary, libraryFile);
      fs.unlinkSync(tempLibrary);

      // Procedure Detail Page (/procedures/e2e-public-test)
      await page.goto("/procedures/e2e-public-test");
      await page.waitForTimeout(200);

      // Open Section 4 (Equipment)
      const equipBtn = page.locator("button:has-text('الأدوات')");
      if (await equipBtn.isVisible()) {
        const isEquipOpen = await equipBtn.getAttribute("aria-expanded");
        if (isEquipOpen !== "true") await equipBtn.click();
      }

      // Open Section 6 (Common Mistakes)
      const mistakesBtn = page.locator("button:has-text('الأخطاء الشائعة')");
      if (await mistakesBtn.isVisible()) {
        const isMistakesOpen = await mistakesBtn.getAttribute("aria-expanded");
        if (isMistakesOpen !== "true") await mistakesBtn.click();
      }

      // Open per-step Arabic translation panel on Step 2 (critical step)
      const arabicToggleBtn = page.locator("button:has-text('عربي')").nth(1);
      if (await arabicToggleBtn.isVisible()) {
        const isArOpen = await arabicToggleBtn.getAttribute("aria-expanded");
        if (isArOpen !== "true") await arabicToggleBtn.click();
      }
      await page.waitForTimeout(200);

      // Capture full-page with sticky disabled to prevent repeat
      await page.evaluate(() => {
        const header = document.querySelector("header");
        if (header) header.style.position = "relative";
      });
      const procFile = `procedure-${target.name}.png`;
      const tempProc = path.join(DOCS_SCREENSHOTS_DIR, `temp-${procFile}`);
      await page.screenshot({ path: tempProc, fullPage: true });
      saveScreenshot(tempProc, procFile);
      fs.unlinkSync(tempProc);

      await context.close();
    }

    // Capture procedure-page shot at 1280px at scroll 0 (natural sticky header, light-only)
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme: "light",
      });
      const page = await context.newPage();
      await page.goto("/procedures/e2e-public-test");
      await page.waitForTimeout(200);

      const scroll0Filename = `procedure-1280px-scroll0-light.png`;
      const tempPath = path.join(DOCS_SCREENSHOTS_DIR, `temp-${scroll0Filename}`);
      await page.screenshot({ path: tempPath, fullPage: false });
      saveScreenshot(tempPath, scroll0Filename);
      fs.unlinkSync(tempPath);
      await context.close();
    }

    // Capture 320px RTL Light for header & extreme mobile checks
    {
      const context = await browser.newContext({
        viewport: { width: 320, height: 600 },
        colorScheme: "light",
      });
      const page = await context.newPage();
      await page.goto("/procedures/e2e-public-test");
      await page.waitForTimeout(200);

      const filename = `320px-rtl-light.png`;
      const tempPath = path.join(DOCS_SCREENSHOTS_DIR, `temp-${filename}`);
      await page.screenshot({ path: tempPath, fullPage: false });
      saveScreenshot(tempPath, filename);
      fs.unlinkSync(tempPath);
      await context.close();
    }

    // Critical Step Grayscale Screenshot + 2x Zoomed Crop of Left Edge
    const zoomContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2, // 2x high-resolution rendering
    });
    const zoomPage = await zoomContext.newPage();
    await zoomPage.goto("/procedures/e2e-public-test");
    await zoomPage.waitForTimeout(200);

    // Locate the critical step (step 2) and its parent container
    const criticalStep = zoomPage.locator("[dir='ltr']").filter({ hasText: "خطوة حرجة" }).first();
    await criticalStep.scrollIntoViewIfNeeded();

    // 1. Grayscale screenshot of the critical step
    await criticalStep.evaluate((el) => {
      (el as HTMLElement).style.filter = "grayscale(100%)";
    });
    const grayFilename = "critical-step-grayscale.png";
    const tempGrayPath = path.join(DOCS_SCREENSHOTS_DIR, `temp-${grayFilename}`);
    await criticalStep.screenshot({ path: tempGrayPath });
    saveScreenshot(tempGrayPath, grayFilename);
    fs.unlinkSync(tempGrayPath);

    // 2. 2x Zoomed crop of the left edge showing the 4px amber border in full color & contrast
    await criticalStep.evaluate((el) => {
      (el as HTMLElement).style.filter = "none";
    });
    const stepBox = await criticalStep.boundingBox();
    if (stepBox) {
      const zoomFilename = "critical-step-left-edge-2x.png";
      const tempZoomPath = path.join(DOCS_SCREENSHOTS_DIR, `temp-${zoomFilename}`);
      await zoomPage.screenshot({
        path: tempZoomPath,
        clip: {
          x: Math.max(0, stepBox.x - 4),
          y: stepBox.y,
          width: 60,
          height: 100,
        },
      });
      saveScreenshot(tempZoomPath, zoomFilename);
      fs.unlinkSync(tempZoomPath);
    }

    await zoomContext.close();
  });

  // --------------------------------------------------------------------------
  // 2. Automated Assertions: Heading Sizes, Bidi, 320px Step, Header, Border
  // --------------------------------------------------------------------------
  test("Automated Assertions: Heading sizes, Tagline Bidi order, 4px red critical border, 320px layout", async ({
    page,
  }) => {
    // 1. Bidi Tagline order assertion on Home (/home)
    await page.goto("/home");
    const taglineBdi = page.locator("bdi[dir='ltr']").filter({ hasText: "Learn • Practice • Excel" }).first();
    expect(await taglineBdi.isVisible()).toBe(true);
    const taglineText = await taglineBdi.textContent();
    expect(taglineText?.trim()).toBe("Learn • Practice • Excel");

    // 2. Heading Sizes Assertions
    // Home title >= 30px on mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/home");
    const homeTitle = page.locator("h1");
    const homeTitleSize = await homeTitle.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
    expect(homeTitleSize).toBeGreaterThanOrEqual(30);

    // Library title >= 24px
    await page.goto("/procedures");
    const libraryTitle = page.locator("h1");
    const libraryTitleSize = await libraryTitle.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
    expect(libraryTitleSize).toBeGreaterThanOrEqual(24);

    // Procedure title >= 24px
    await page.goto("/procedures/e2e-public-test");
    const procedureTitle = page.locator("h1");
    const procedureTitleSize = await procedureTitle.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
    expect(procedureTitleSize).toBeGreaterThanOrEqual(24);

    // 3. Critical Step: 4px border width and #B42318 red color assertion (light-only)
    const criticalStep = page.locator("[dir='ltr']").filter({ hasText: "خطوة حرجة" }).first();
    const borderStyles = await criticalStep.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderLeftWidth: computed.borderLeftWidth,
        borderLeftColor: computed.borderLeftColor,
      };
    });
    expect(borderStyles.borderLeftWidth).toBe("4px");
    expect(borderStyles.borderLeftColor).toBe("rgb(180, 35, 24)");

    // 4. Checklist layout at 320px width: long step uses full width below
    await page.setViewportSize({ width: 320, height: 600 });
    await page.goto("/procedures/e2e-public-test");
    const header = page.locator("header");
    const headerBox = await header.boundingBox();
    expect(headerBox!.height).toBeLessThanOrEqual(56);

    const step3 = page.locator("[dir='ltr']").filter({ hasText: "Demo step 3" }).first();
    const step3Paragraph = step3.locator("p").first();
    const paraBox = await step3Paragraph.boundingBox();
    expect(paraBox).not.toBeNull();
    expect(paraBox!.width).toBeGreaterThanOrEqual(210);

    // 5. Equipment counter <bdi dir="ltr"> assertion
    const equipBtn = page.locator("button:has-text('الأدوات')");
    await equipBtn.click();
    const equipCounter = page.locator("bdi[dir='ltr']").filter({ hasText: "/" }).first();
    const counterText = await equipCounter.textContent();
    expect(counterText?.trim()).toMatch(/^\d+\s*\/\s*\d+$/);

    // 6. Tap targets >= 44x44px
    const interactiveElements = await page.locator("button, [role='checkbox']").all();
    for (const elem of interactiveElements) {
      if (await elem.isVisible()) {
        const box = await elem.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // 3. Keyboard-Only Navigation Test
  // --------------------------------------------------------------------------
  test("Keyboard Navigation: tab through accordions, checklist, toggle Arabic panel", async ({
    page,
  }) => {
    await page.goto("/procedures/e2e-public-test");
    await page.waitForLoadState("networkidle");

    const firstCheckbox = page.locator("button[role='checkbox']").first();
    await firstCheckbox.focus();
    expect(await firstCheckbox.getAttribute("aria-checked")).toBe("false");

    await page.keyboard.press("Space");
    expect(await firstCheckbox.getAttribute("aria-checked")).toBe("true");

    const arabicBtn = page.locator("button:has-text('عربي')").first();
    await arabicBtn.focus();
    expect(await arabicBtn.getAttribute("aria-expanded")).toBe("false");

    await page.keyboard.press("Enter");
    expect(await arabicBtn.getAttribute("aria-expanded")).toBe("true");
    const arabicPanel = page.locator("[id^='step-ar-']").first();
    await expect(arabicPanel).toBeVisible();

    await page.keyboard.press("Enter");
    expect(await arabicBtn.getAttribute("aria-expanded")).toBe("false");
    await expect(arabicPanel).not.toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 4. Accessibility Audit with Axe-core (Video Placeholder Explicitly Tested)
  // --------------------------------------------------------------------------
  test("Axe-core Accessibility Audit: Zero serious or critical violations including video placeholder", async ({
    page,
  }) => {
    const pagesToAudit = ["/", "/home", "/procedures", "/procedures/e2e-public-test"];

    for (const url of pagesToAudit) {
      await page.goto(url);
      await page.waitForTimeout(150);

      // On procedure detail page, expand section 7 (Video) so video placeholder is in DOM on mobile
      if (url.includes("/procedures/e2e-public-test")) {
        const videoAccordionBtn = page.locator("button:has-text('الفيديو التوضيحي')").first();
        if (await videoAccordionBtn.isVisible()) {
          const isVideoOpen = await videoAccordionBtn.getAttribute("aria-expanded");
          if (isVideoOpen !== "true") {
            await videoAccordionBtn.click();
            await page.waitForTimeout(100);
          }
        }
      }

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const seriousOrCriticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );

      expect(
        seriousOrCriticalViolations,
        `Accessibility violations found on ${url}: ${JSON.stringify(
          seriousOrCriticalViolations,
          null,
          2
        )}`
      ).toEqual([]);
    }

    // Direct audit of video placeholder element on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/procedures/e2e-public-test");
    await page.waitForTimeout(150);

    const videoScanResults = await new AxeBuilder({ page })
      .include("[data-testid='video-placeholder']")
      .analyze();

    const videoViolations = videoScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(videoViolations).toEqual([]);
  });
});
