import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local for temporary procedure publishing
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

interface AuditTarget {
  name: string;
  url: string;
}

const TARGETS: AuditTarget[] = [
  { name: "Home Page", url: "http://localhost:3000/home" },
  { name: "Procedures Library", url: "http://localhost:3000/procedures" },
  { name: "Procedure Detail Page (abg-sampling)", url: "http://localhost:3000/procedures/abg-sampling" },
  { name: "Admin Login Page", url: "http://localhost:3000/admin/login" },
];

async function main() {
  console.log("================================================================================");
  console.log("🚀 RUNNING LIGHTHOUSE MOBILE AUDITS");
  console.log("================================================================================");

  const supabase = createClient(supabaseUrl, secretKey);

  // 1. Temporarily publish abg-sampling so the procedure page can be audited
  console.log("Temporarily publishing abg-sampling for procedure page audit...");
  await supabase.from("procedures").update({ published: true }).eq("slug", "abg-sampling");

  const results: any[] = [];
  const reportsDir = path.join(process.cwd(), ".lighthouse-reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  try {
    for (const target of TARGETS) {
      console.log(`\nAuditing: ${target.name} (${target.url})...`);
      const safeName = target.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const reportPath = path.join(reportsDir, `${safeName}.json`);

      const cmd = `npx lighthouse "${target.url}" --output=json --output-path="${reportPath}" --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate --chrome-flags="--headless=new --no-sandbox" --quiet`;

      try {
        execSync(cmd, { stdio: "inherit", timeout: 120000 });

        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
          const cats = report.categories || {};
          const audits = report.audits || {};

          const perf = Math.round((cats.performance?.score || 0) * 100);
          const a11y = Math.round((cats.accessibility?.score || 0) * 100);
          const bp = Math.round((cats["best-practices"]?.score || 0) * 100);
          const seo = Math.round((cats.seo?.score || 0) * 100);

          const lcp = audits["largest-contentful-paint"]?.displayValue || "N/A";
          const cls = audits["cumulative-layout-shift"]?.displayValue || "N/A";
          const tbt = audits["total-blocking-time"]?.displayValue || "N/A";

          results.push({
            page: target.name,
            performance: perf,
            accessibility: a11y,
            bestPractices: bp,
            seo: seo,
            lcp,
            cls,
            tbt,
          });

          console.log(`✅ ${target.name}: Perf: ${perf}, A11y: ${a11y}, BP: ${bp}, SEO: ${seo} | LCP: ${lcp}, CLS: ${cls}, TBT: ${tbt}`);
        }
      } catch (err: any) {
        console.error(`❌ Audit failed for ${target.name}:`, err?.message);
        results.push({
          page: target.name,
          error: err?.message,
        });
      }
    }
  } finally {
    // 2. Guaranteed cleanup: unpublish abg-sampling back to false
    console.log("\nRestoring abg-sampling to published=false in DEV database...");
    await supabase.from("procedures").update({ published: false }).eq("slug", "abg-sampling");

    const { data: finalProcs } = await supabase.from("procedures").select("slug, published");
    console.log("Final DEV Procedures:", finalProcs);
  }

  console.log("\n================================================================================");
  console.log("📊 LIGHTHOUSE MOBILE RESULTS TABLE");
  console.log("================================================================================");
  console.table(results);
}

main().catch(console.error);
