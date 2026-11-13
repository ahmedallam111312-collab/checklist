import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const BASE_URL = "http://localhost:3000";
const DOCS_DIR = path.join(process.cwd(), "docs", "screenshots");
const ARTIFACT_DIR = "C:\\Users\\IT\\.gemini\\antigravity\\brain\\499e886a-e714-40e4-b31f-59ce097479d6";
const DB_SOURCE = "DEV Database (smfsmixdymphtgfalupl)";

const PAGES = [
  { name: "cover", path: "/" },
  { name: "home", path: "/home" },
  { name: "procedures", path: "/procedures" },
  { name: "about", path: "/about" },
  { name: "login", path: "/admin/login" },
];

const VIEWPORTS = [
  { name: "320px", width: 320, height: 568 },
  { name: "390px", width: 390, height: 844 },
  { name: "1280px", width: 1280, height: 800 },
];

const THEMES = ["light"] as const;

async function main() {
  console.log("================================================================================");
  console.log("📸 PUBLIC SCREENSHOT SWEEP (320px, 390px, 1280px Light-Only)");
  console.log("================================================================================");

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const capturedList: any[] = [];

  for (const pageInfo of PAGES) {
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        const filename = `public-${pageInfo.name}-${vp.name}-${theme}.png`;
        const docsPath = path.join(DOCS_DIR, filename);
        const artPath = path.join(ARTIFACT_DIR, filename);

        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: "light",
        });
        const page = await context.newPage();

        await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: "networkidle" });

        await page.waitForTimeout(400);

        // Screenshot full viewport / page
        await page.screenshot({ path: docsPath, fullPage: false });
        fs.copyFileSync(docsPath, artPath);

        const bytes = fs.readFileSync(docsPath);
        const md5 = crypto.createHash("md5").update(bytes).digest("hex").toUpperCase();
        const stat = fs.statSync(docsPath);

        capturedList.push({
          filename,
          page: pageInfo.name,
          viewport: vp.name,
          theme,
          sizeKB: (stat.size / 1024).toFixed(1),
          md5,
          database: DB_SOURCE,
        });

        console.log(`Saved: ${filename} (${(stat.size / 1024).toFixed(1)} KB) - MD5: ${md5}`);
        await context.close();
      }
    }
  }

  await browser.close();

  console.log("\n================================================================================");
  console.log("📊 SCREENSHOT SWEEP SUMMARY TABLE");
  console.log("================================================================================");
  console.table(
    capturedList.map((c) => ({
      filename: c.filename,
      viewport: c.viewport,
      theme: c.theme,
      sizeKB: `${c.sizeKB} KB`,
      md5: c.md5,
      database: c.database,
    }))
  );
}

main().catch(console.error);
