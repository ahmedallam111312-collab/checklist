import { execSync } from "child_process";
import fs from "fs";
import path from "path";
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

if (!supabaseUrl || !secretKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey);

const TEST_SLUG = "e2e-lighthouse-test";

interface PageRun {
  run: number;
  perf: number;
  a11y: number;
  bp: number;
  seo: number;
  lcp: number;
  cls: number;
  tbt: number;
  fcp: number;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  console.log("================================================================================");
  console.log("🚀 RUNNING 3-RUN LIGHTHOUSE MOBILE AUDIT (REPORTING MEDIAN)");
  console.log("================================================================================");

  let tempProcedureId: string | null = null;

  try {
    // 1. Seed temporary e2e- procedure with complete 7 sections
    console.log("🌱 Seeding temporary published procedure with complete 7 sections...");
    const { data: proc, error: procErr } = await supabase
      .from("procedures")
      .insert({
        slug: TEST_SLUG,
        title: "E2E Lighthouse Clinical Audit Procedure",
        short_description: "Standardized clinical procedure for mobile performance verification.",
        definition: "A standardized clinical evaluation protocol designed to test layout stability, typography metrics, and mobile performance budgets.",
        cover_path: null,
        cover_alt: "E2E test cover image",
        published: true,
        sort_order: 9999,
        video_status: "none",
      })
      .select("id")
      .single();

    if (procErr || !proc) {
      throw new Error(`Failed to seed test procedure: ${procErr?.message}`);
    }
    tempProcedureId = proc.id;

    // Seed list items
    await supabase.from("list_items").insert([
      { procedure_id: tempProcedureId, kind: "indication", text: "Emergency simulation evaluation", sort_order: 10 },
      { procedure_id: tempProcedureId, kind: "indication", text: "Standard critical care drill", sort_order: 20 },
      { procedure_id: tempProcedureId, kind: "contraindication", text: "Simulated uncalibrated equipment", sort_order: 10 },
      { procedure_id: tempProcedureId, kind: "common_mistake", text: "Failure to verify simulated patient ID", sort_order: 10 },
    ]);

    // Seed equipment
    await supabase.from("equipment_items").insert([
      { procedure_id: tempProcedureId, name: "Antiseptic prep swab", sort_order: 10 },
      { procedure_id: tempProcedureId, name: "Sterile gloves (7.5)", sort_order: 20 },
      { procedure_id: tempProcedureId, name: "Collection syringe kit", sort_order: 30 },
    ]);

    // Seed steps
    await supabase.from("checklist_steps").insert([
      { procedure_id: tempProcedureId, sort_order: 10, phase: "Preparation", text_en: "Verify equipment sterility and calibration", text_ar: "التحقق من تعقيم ومعايرة التجهيزات", is_critical: false },
      { procedure_id: tempProcedureId, sort_order: 20, phase: "Preparation", text_en: "Confirm mock patient identity with two identifiers", text_ar: "تأكيد هوية المريض عبر معرّفين سريريين", is_critical: true },
      { procedure_id: tempProcedureId, sort_order: 30, phase: "Execution", text_en: "Perform sterile puncture following anatomical landmarks", text_ar: "إجراء الوخز المعقم وفق العلامات التشريحية", is_critical: true },
      { procedure_id: tempProcedureId, sort_order: 40, phase: "Post-Procedure", text_en: "Apply firm manual pressure over site for 5 minutes", text_ar: "تطبيق ضغط يدوي مباشر لمدة 5 دقائق", is_critical: true },
      { procedure_id: tempProcedureId, sort_order: 50, phase: "Post-Procedure", text_en: "Dispose of contaminated sharps in sharps container", text_ar: "التخلص من الإبرة في حاوية النفايات الحادة", is_critical: false },
    ]);

    console.log(`✅ Temporary procedure seeded successfully: ID ${tempProcedureId}`);

    const targets = [
      { name: "Home Page", url: "http://localhost:3000/home" },
      { name: "Procedures Library", url: "http://localhost:3000/procedures" },
      { name: "Procedure Detail Page", url: `http://localhost:3000/procedures/${TEST_SLUG}` },
      { name: "Admin Login Page", url: "http://localhost:3000/admin/login" },
    ];

    const reportsDir = path.join(process.cwd(), ".lighthouse-reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const summaryResults: any[] = [];

    for (const target of targets) {
      console.log(`\n================================================================`);
      console.log(`📊 Auditing: ${target.name} (3 runs)...`);
      console.log(`================================================================`);

      const runs: PageRun[] = [];

      for (let runIdx = 1; runIdx <= 3; runIdx++) {
        const safeName = target.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        const reportPath = path.join(reportsDir, `${safeName}-run${runIdx}.json`);

        console.log(`  Run ${runIdx}/3 for ${target.name}...`);
        const cmd = `npx lighthouse "${target.url}" --output=json --output-path="${reportPath}" --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate --chrome-flags="--headless=new --no-sandbox" --quiet`;

        execSync(cmd, { stdio: "inherit", timeout: 180000 });

        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
          const cats = report.categories || {};
          const audits = report.audits || {};

          runs.push({
            run: runIdx,
            perf: Math.round((cats.performance?.score || 0) * 100),
            a11y: Math.round((cats.accessibility?.score || 0) * 100),
            bp: Math.round((cats["best-practices"]?.score || 0) * 100),
            seo: Math.round((cats.seo?.score || 0) * 100),
            lcp: audits["largest-contentful-paint"]?.numericValue ? Math.round(audits["largest-contentful-paint"].numericValue / 100) / 10 : 0,
            cls: audits["cumulative-layout-shift"]?.numericValue ? Math.round(audits["cumulative-layout-shift"].numericValue * 1000) / 1000 : 0,
            tbt: audits["total-blocking-time"]?.numericValue ? Math.round(audits["total-blocking-time"].numericValue) : 0,
            fcp: audits["first-contentful-paint"]?.numericValue ? Math.round(audits["first-contentful-paint"].numericValue / 100) / 10 : 0,
          });
        }
      }

      const medianPerf = median(runs.map((r) => r.perf));
      const medianA11y = median(runs.map((r) => r.a11y));
      const medianBp = median(runs.map((r) => r.bp));
      const medianSeo = median(runs.map((r) => r.seo));
      const medianLcp = median(runs.map((r) => r.lcp));
      const medianCls = median(runs.map((r) => r.cls));
      const medianTbt = median(runs.map((r) => r.tbt));

      summaryResults.push({
        page: target.name,
        runs,
        median: {
          perf: medianPerf,
          a11y: medianA11y,
          bp: medianBp,
          seo: medianSeo,
          lcp: `${medianLcp} s`,
          cls: `${medianCls}`,
          tbt: `${medianTbt} ms`,
        },
      });
    }

    console.log("\n================================================================================");
    console.log("🏆 3-RUN LIGHTHOUSE MOBILE MEDIAN RESULTS:");
    console.log("================================================================================");
    console.table(
      summaryResults.map((s) => ({
        Page: s.page,
        "Performance (Median)": s.median.perf,
        "LCP (Median)": s.median.lcp,
        "CLS (Median)": s.median.cls,
        "TBT (Median)": s.median.tbt,
        "A11y (Median)": s.median.a11y,
        "Best Practices": s.median.bp,
        SEO: s.median.seo,
      }))
    );

    // Save summary json
    fs.writeFileSync(
      path.join(reportsDir, "p5-lighthouse-summary.json"),
      JSON.stringify(summaryResults, null, 2)
    );
  } finally {
    // Clean up temporary procedure
    if (tempProcedureId) {
      console.log("\n🧹 Cleaning up temporary seeded procedure from DEV database...");
      await supabase.from("checklist_steps").delete().eq("procedure_id", tempProcedureId);
      await supabase.from("equipment_items").delete().eq("procedure_id", tempProcedureId);
      await supabase.from("list_items").delete().eq("procedure_id", tempProcedureId);
      await supabase.from("procedures").delete().eq("id", tempProcedureId);
      console.log("✅ Temporary seeded procedure removed.");
    }

    // Verify DEV baseline
    console.log("\n🔍 Verifying DEV database baseline...");
    const { data: devProcs } = await supabase
      .from("procedures")
      .select("slug, published")
      .order("sort_order");

    console.log("DEV Procedures Status:", devProcs);
    const publishedCount = devProcs?.filter((p) => p.published).length || 0;
    const startersCount = devProcs?.length || 0;
    console.log(`Total Starters: ${startersCount} (Expected: 5), Published: ${publishedCount} (Expected: 0)`);
    if (startersCount === 5 && publishedCount === 0) {
      console.log("✅ DEV Database confirmed pristine baseline: 5 unpublished starters.");
    } else {
      console.error("⚠️ DEV Database state differs from expected baseline!");
    }
  }
}

main().catch((err) => {
  console.error("Fatal error during Lighthouse runs:", err);
  process.exit(1);
});
