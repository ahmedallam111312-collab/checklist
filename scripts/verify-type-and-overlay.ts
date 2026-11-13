import fs from "fs";
import path from "path";
import { chromium } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import sharp from "sharp";

loadEnvConfig(process.cwd());

const BASE_URL = "http://localhost:3000";
const DOCS_DIR = path.join(process.cwd(), "docs", "screenshots");
const ARTIFACT_DIR = "C:\\Users\\IT\\.gemini\\antigravity\\brain\\499e886a-e714-40e4-b31f-59ce097479d6";

async function verify() {
  console.log("================================================================================");
  console.log("🔍 ITEMS B & C: TYPE HIERARCHY & DELETE OVERLAY VERIFICATION");
  console.log("================================================================================\n");

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  // 1. Authenticate as admin
  console.log("[1/4] Authenticating as admin...");
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill("#admin_email", process.env.E2E_ADMIN_EMAIL!);
  await page.fill("#admin_password", process.env.E2E_ADMIN_PASSWORD!);
  await page.click("button[type='submit']");
  await page.waitForURL(/\/admin$/);

  // 2. Find first existing procedure
  const editLink = await page.locator("a[href*='/admin/procedures/']:not([href*='/new'])").first().getAttribute("href");
  console.log(`[2/4] Navigating to procedure: ${editLink}`);

  // ---------------------------------------------------------------------------
  // ITEM B: TYPE HIERARCHY COMPUTED SIZES TEST
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("📏 ITEM B: MEASURING COMPUTED FONT SIZES ACROSS VIDEO STATES");
  console.log("--------------------------------------------------------------------------------");

  const states = [
    { name: "empty", query: "" },
    { name: "uploading", query: "&video_state=uploading" },
    { name: "processing", query: "&video_state=processing" },
    { name: "ready", query: "&video_state=ready" },
    { name: "error", query: "&video_state=error" },
  ];

  const measurements: any[] = [];

  for (const st of states) {
    await page.goto(`${BASE_URL}${editLink}?tab=video${st.query}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    const sizes = await page.evaluate((stateName) => {
      const headingEl = document.querySelector(`[data-testid='video-heading-${stateName}']`);
      const supportingEl = document.querySelector(`[data-testid='video-supporting-${stateName}']`);

      if (!headingEl || !supportingEl) {
        return {
          state: stateName,
          error: `Missing element: heading=${!!headingEl}, supporting=${!!supportingEl}`,
        };
      }

      const hStyle = window.getComputedStyle(headingEl);
      const sStyle = window.getComputedStyle(supportingEl);

      const hPx = parseFloat(hStyle.fontSize);
      const sPx = parseFloat(sStyle.fontSize);

      return {
        state: stateName,
        headingTag: headingEl.tagName,
        headingFontSize: hStyle.fontSize,
        headingFontWeight: hStyle.fontWeight,
        headingNumeric: hPx,
        supportingTag: supportingEl.tagName,
        supportingFontSize: sStyle.fontSize,
        supportingNumeric: sPx,
        isHeadingLarger: hPx > sPx,
        differencePx: (hPx - sPx).toFixed(2),
      };
    }, st.name);

    measurements.push(sizes);
    console.log(`State [${st.name.toUpperCase()}]: Heading = ${sizes.headingFontSize} (${sizes.headingFontWeight}), Supporting = ${sizes.supportingFontSize} -> Difference: +${sizes.differencePx}px (${sizes.isHeadingLarger ? "PASS" : "FAIL"})`);

    if (!sizes.isHeadingLarger) {
      throw new Error(`❌ Type hierarchy assertion failed in state '${st.name}': heading (${sizes.headingFontSize}) <= supporting (${sizes.supportingFontSize})!`);
    }
  }

  console.log("\n📊 Item B Summary Table:");
  console.table(measurements.map(m => ({
    State: m.state,
    Heading: `${m.headingFontSize} (wt: ${m.headingFontWeight})`,
    Supporting: m.supportingFontSize,
    Difference: `+${m.differencePx}px`,
    Status: m.isHeadingLarger ? "✅ PASS" : "❌ FAIL",
  })));

  // ---------------------------------------------------------------------------
  // ITEM C: DELETE OVERLAY COVERAGE TEST & PROOF
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🛡️ ITEM C: VERIFYING DELETE OVERLAY VIEWPORT COVERAGE AT 390px");
  console.log("--------------------------------------------------------------------------------");

  await page.goto(`${BASE_URL}${editLink}?tab=video&video_state=delete_confirm`, { waitUntil: "networkidle" });
  await page.waitForSelector("[role='dialog']", { state: "visible" });
  await page.waitForTimeout(400);

  const overlayRect = await page.evaluate(() => {
    const dialog = document.querySelector("[role='dialog']");
    if (!dialog) return null;
    const r = dialog.getBoundingClientRect();
    const style = window.getComputedStyle(dialog);
    return {
      top: r.top,
      left: r.left,
      bottom: r.bottom,
      right: r.right,
      width: r.width,
      height: r.height,
      position: style.position,
      zIndex: style.zIndex,
      marginTop: style.marginTop,
      parentTagName: dialog.parentElement?.tagName,
    };
  });

  console.log("Delete Modal Overlay Computed Properties:", overlayRect);

  if (!overlayRect) {
    throw new Error("❌ Dialog overlay element not found!");
  }

  if (overlayRect.top !== 0) {
    throw new Error(`❌ Dialog overlay does NOT cover the top! top = ${overlayRect.top}px (Expected: 0px)`);
  }
  if (overlayRect.height !== 844 || overlayRect.width !== 390) {
    throw new Error(`❌ Dialog overlay does NOT cover full 390x844 viewport! Got ${overlayRect.width}x${overlayRect.height}`);
  }
  console.log("✅ Dialog overlay covers 100% of viewport from top=0 to bottom=844!");

  // Capture screenshot of delete confirm dialog at 390px
  const screenshotName = "video-delete-confirm-390px-dark.png";
  const docsPath = path.join(DOCS_DIR, screenshotName);
  const artPath = path.join(ARTIFACT_DIR, screenshotName);

  await page.screenshot({ path: docsPath, fullPage: false });
  fs.copyFileSync(docsPath, artPath);
  console.log(`📸 Saved screenshot to: ${docsPath} and artifact dir`);

  // Inspect the top pixels using Sharp
  const img = sharp(docsPath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  console.log("\n🔍 Pixel inspection of top rows (y=0 to y=30):");
  for (let y = 0; y <= 25; y += 5) {
    const idx = (y * info.width + 100) * info.channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    console.log(` - Row y=${y}: RGB(${r}, ${g}, ${b}) -> Dimmed overlay verified.`);
    // Dimmed overlay with bg-black/70 on #07182a results in dark values (R < 10, G < 15, B < 25)
    if (r > 20 || g > 30 || b > 40) {
      throw new Error(`❌ Pixel at y=${y} is not dimmed by overlay! RGB(${r}, ${g}, ${b})`);
    }
  }
  console.log("✅ PROOF: Pixels at y=0 through y=25 are fully dimmed by overlay!");

  await browser.close();
  console.log("\n================================================================================");
  console.log("🎉 ALL ITEM B & C ASSERTIONS PASSED WITH ZERO VIOLATIONS!");
  console.log("================================================================================\n");
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
