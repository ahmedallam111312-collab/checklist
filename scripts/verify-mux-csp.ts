import { chromium } from "playwright";

async function verifyMuxCSP() {
  console.log("================================================================================");
  console.log("🛡️ VERIFYING CSP VIOLATIONS & MUX PLAYER COMPATIBILITY");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext();
  const page = await context.newPage();

  const cspViolations: string[] = [];
  const errors: string[] = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("Content Security Policy") || text.includes("violates the following Content Security Policy")) {
      cspViolations.push(text);
    }
  });

  page.on("pageerror", (err) => {
    errors.push(err.message);
  });

  // Navigate across public and admin pages
  const routes = ["/", "/home", "/procedures", "/about", "/admin/login"];

  for (const route of routes) {
    console.log(`Checking route: ${route}`);
    await page.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
  }

  await browser.close();

  console.log(`Total CSP Violations Detected: ${cspViolations.length}`);
  if (cspViolations.length > 0) {
    console.error("Violations:", cspViolations);
    process.exit(1);
  } else {
    console.log("✅ Zero CSP violations across all routes!");
  }
}

verifyMuxCSP().catch((err) => {
  console.error("Error verifying CSP:", err);
  process.exit(1);
});
