import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL = "http://localhost:3000";

const PUBLIC_PAGES = [
  { name: "Cover Page (/)", path: "/" },
  { name: "Home Page (/home)", path: "/home" },
  { name: "Procedures Library (/procedures)", path: "/procedures" },
  { name: "About & Credits (/about)", path: "/about" },
  { name: "Admin Login (/admin/login)", path: "/admin/login" },
];

async function main() {
  console.log("================================================================================");
  console.log("🛡️ PUBLIC QUALITY SUITE: AXE, OVERFLOW, RTL/BIDI, BROKEN LINKS & IMAGES");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true, channel: "chrome" });

  const axeResults: any[] = [];
  const overflowResults: any[] = [];
  const brokenLinks: any[] = [];
  const brokenImages: any[] = [];
  const rtlChecks: any[] = [];

  for (const pageInfo of PUBLIC_PAGES) {
    console.log(`\nTesting page: ${pageInfo.name}...`);
    const pageUrl = `${BASE_URL}${pageInfo.path}`;

    // 1. Desktop Light-Only Axe Audits
    for (const theme of ["light"] as const) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme: "light",
      });
      const page = await context.newPage();
      await page.goto(pageUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);

      const axe = await new AxeBuilder({ page }).analyze();
      const critical = axe.violations.filter((v) => v.impact === "critical");
      const serious = axe.violations.filter((v) => v.impact === "serious");

      axeResults.push({
        page: pageInfo.name,
        theme,
        critical: critical.length,
        serious: serious.length,
        moderate: axe.violations.filter((v) => v.impact === "moderate").length,
        minor: axe.violations.filter((v) => v.impact === "minor").length,
        pass: critical.length === 0 && serious.length === 0 ? "✅ PASS" : "❌ FAIL",
      });

      // RTL Check on root
      const rootDir = await page.evaluate(() => document.documentElement.dir);
      const rootLang = await page.evaluate(() => document.documentElement.lang);
      rtlChecks.push({
        page: pageInfo.name,
        dir: rootDir,
        lang: rootLang,
        pass: rootDir === "rtl" && rootLang === "ar" ? "✅ PASS" : "❌ FAIL",
      });

      // Broken links check on this page
      const hrefs = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("a[href]"));
        return anchors
          .map((a) => a.getAttribute("href"))
          .filter((h): h is string => !!h && !h.startsWith("#") && !h.startsWith("mailto:") && !h.startsWith("tel:"));
      });

      for (const href of Array.from(new Set(hrefs))) {
        const targetUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        try {
          const res = await page.request.get(targetUrl);
          if (res.status() >= 400) {
            brokenLinks.push({ source: pageInfo.name, link: href, status: res.status() });
          }
        } catch (e: any) {
          brokenLinks.push({ source: pageInfo.name, link: href, error: e.message });
        }
      }

      // Broken images check
      const imgs = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        return images.map((img) => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          complete: img.complete,
          alt: img.alt,
        }));
      });

      for (const img of imgs) {
        if (!img.complete || img.naturalWidth === 0) {
          brokenImages.push({ source: pageInfo.name, src: img.src, reason: "Image not loaded (naturalWidth === 0)" });
        }
      }

      await context.close();
    }

    // 2. Mobile Viewport Overflow Audits (320px & 390px)
    for (const width of [320, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 320 ? 568 : 844 },
      });
      const page = await context.newPage();
      await page.goto(pageUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);

      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const maxW = Math.max(scrollWidth, bodyScrollWidth);
        const hasOverflow = maxW > docWidth;
        return { docWidth, maxW, diff: maxW - docWidth, hasOverflow };
      });

      overflowResults.push({
        page: pageInfo.name,
        viewportWidth: `${width}px`,
        scrollWidth: `${overflow.maxW}px`,
        difference: `${overflow.diff}px`,
        status: overflow.hasOverflow ? "❌ OVERFLOW" : "✅ NO OVERFLOW",
      });

      await context.close();
    }
  }

  await browser.close();

  console.log("\n📊 AXE ACCESSIBILITY RESULTS (Target: 0 Critical / Serious):");
  console.table(axeResults);

  console.log("\n📊 HORIZONTAL OVERFLOW RESULTS AT 320px & 390px:");
  console.table(overflowResults);

  console.log("\n📊 RTL & LANG VALIDATION:");
  console.table(rtlChecks.slice(0, 5));

  console.log(`\n🔗 Broken Links Found: ${brokenLinks.length}`);
  if (brokenLinks.length > 0) console.table(brokenLinks);
  else console.log("✅ Zero broken links across all public routes!");

  console.log(`\n🖼️ Broken Images Found: ${brokenImages.length}`);
  if (brokenImages.length > 0) console.table(brokenImages);
  else console.log("✅ Zero broken images across all public routes!");
}

main().catch(console.error);
