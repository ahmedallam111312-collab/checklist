import { chromium } from "playwright";

interface ViewportSpec {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: ViewportSpec[] = [
  { name: "320px", width: 320, height: 568 },
  { name: "390px", width: 390, height: 844 },
  { name: "1280px", width: 1280, height: 800 },
  { name: "1920px", width: 1920, height: 1080 },
];

async function main() {
  console.log("================================================================================");
  console.log("🔍 VERIFYING HERO SCROLL AT END POSITION (320, 390, 1280, 1920)");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const results: any[] = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: "dark",
    });
    const page = await context.newPage();

    await page.goto("http://localhost:3000/home", { waitUntil: "networkidle" });
    await page.waitForSelector("[data-testid='hero-3d-stage']", { state: "visible" });
    await page.waitForTimeout(600);

    // Get ScrollTrigger metrics and document metrics
    const metrics = await page.evaluate(() => {
      const st = (window as any).ScrollTrigger?.getAll()?.[0];
      const scrollHeight = document.documentElement.scrollHeight;
      const innerHeight = window.innerHeight;
      const maxScrollY = scrollHeight - innerHeight;
      return {
        start: st ? st.start : 0,
        end: st ? st.end : 0,
        pinDistance: st ? st.end - st.start : 0,
        scrollHeight,
        innerHeight,
        maxScrollY,
      };
    });

    // Target scrollY: exactly st.end
    const targetScrollY = Math.min(metrics.end, metrics.maxScrollY);

    // Scroll to end position
    await page.evaluate((y) => window.scrollTo(0, y), targetScrollY);
    await page.waitForTimeout(900); // Wait for 0.6s scrub + settle

    const measured = await page.evaluate(() => {
      const st = (window as any).ScrollTrigger?.getAll()?.[0];
      const stage = document.querySelector("[data-testid='hero-3d-stage']");
      const path = document.querySelector("[data-testid='hero-ecg-path']");
      const sStyle = stage ? window.getComputedStyle(stage) : null;
      const pStyle = path ? window.getComputedStyle(path) : null;
      const allSpans = Array.from(document.querySelectorAll("[data-testid='hero-3d-stage'] span.tabular-nums"));

      return {
        scrollY: window.scrollY,
        progress: st ? parseFloat(st.progress.toFixed(4)) : null,
        transform: sStyle ? sStyle.transform : "none",
        strokeDashoffset: pStyle ? pStyle.strokeDashoffset : "unknown",
        hr: allSpans[0]?.textContent || "72",
        spo2: allSpans[1]?.textContent || "98%",
      };
    });

    results.push({
      width: vp.width,
      viewport: vp.name,
      ...metrics,
      ...measured,
    });

    await context.close();
  }

  // Also check reduced-motion mode and lite mode
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🔍 CHECKING REDUCED MOTION & LITE MODES");
  console.log("--------------------------------------------------------------------------------");

  // Reduced motion context
  const rmContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto("http://localhost:3000/home?mode=reduced-motion", { waitUntil: "networkidle" });
  await rmPage.waitForSelector("[data-testid='hero-3d-stage']", { state: "visible" });

  const rmState = await rmPage.evaluate(() => {
    const stage = document.querySelector("[data-testid='hero-3d-stage']");
    const path = document.querySelector("[data-testid='hero-ecg-path']");
    const sStyle = stage ? window.getComputedStyle(stage) : null;
    const pStyle = path ? window.getComputedStyle(path) : null;
    return {
      mode: "reduced-motion",
      transform: sStyle ? sStyle.transform : "none",
      strokeDashoffset: pStyle ? pStyle.strokeDashoffset : "unknown",
    };
  });
  await rmContext.close();

  // Lite mode context
  const liteContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const litePage = await liteContext.newPage();
  await litePage.goto("http://localhost:3000/home?mode=lite", { waitUntil: "networkidle" });
  await litePage.waitForSelector("[data-testid='hero-3d-stage']", { state: "visible" });

  const liteState = await litePage.evaluate(() => {
    const stage = document.querySelector("[data-testid='hero-3d-stage']");
    const path = document.querySelector("[data-testid='hero-ecg-path']");
    const sStyle = stage ? window.getComputedStyle(stage) : null;
    const pStyle = path ? window.getComputedStyle(path) : null;
    return {
      mode: "lite",
      transform: sStyle ? sStyle.transform : "none",
      strokeDashoffset: pStyle ? pStyle.strokeDashoffset : "unknown",
    };
  });
  await liteContext.close();

  await browser.close();

  console.log("\n📊 TABLE: HERO AT END POSITION ACROSS ALL VIEWPORTS:");
  console.table(
    results.map((r) => ({
      width: r.width,
      scrollY: `${r.scrollY}px`,
      endScrollY: `${r.end}px`,
      maxScrollY: `${r.maxScrollY}px`,
      progress: r.progress,
      dashoffset: r.strokeDashoffset,
      transform: r.transform,
      pass: r.progress === 1.0 && r.strokeDashoffset === "0px" ? "✅ PASS" : "❌ FAIL",
    }))
  );

  console.log("\n📊 FALLBACK MODES COMPARISON:");
  console.log("Reduced Motion:", rmState);
  console.log("Lite Mode:     ", liteState);
  console.log("Do they match visually in DOM resting state?", rmState.transform === liteState.transform && rmState.strokeDashoffset === liteState.strokeDashoffset ? "✅ YES (Identical static resting state)" : "❌ NO");
}

main().catch(console.error);
