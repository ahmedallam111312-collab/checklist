import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import {
  captureDevFingerprint,
  compareDevFingerprints,
} from "../tests/support/dev-fingerprint";

loadEnvConfig(process.cwd());

const BASE_URL = "http://127.0.0.1:3000";
const REPORTS_DIRS = [
  path.join(process.cwd(), "docs", "lighthouse"),
];
for (const dir of REPORTS_DIRS) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
const REPORTS_DIR = REPORTS_DIRS[0];
const TEST_SLUG = "e2e-lighthouse-test";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

function median(vals: number[]): number {
  const s = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : +((s[mid - 1] + s[mid]) / 2).toFixed(3);
}

function extractLcpBreakdown(audits: Record<string, any>) {
  // Lighthouse v12/v13 stores LCP subparts inside lcp-breakdown-insight OR legacy lcp-breakdown / metrics
  const breakdownAudit =
    audits["lcp-breakdown-insight"] ||
    audits["largest-contentful-paint-element"] ||
    null;

  const items: any[] = [];
  if (breakdownAudit?.details?.items) {
    for (const item of breakdownAudit.details.items) {
      if (item?.type === "table" && Array.isArray(item.items)) {
        items.push(...item.items);
      } else if (item?.subpart || item?.phase || item?.timing !== undefined) {
        items.push(item);
      }
    }
  }

  const elementItems = audits["largest-contentful-paint-element"]?.details?.items || [];
  const ttfbMs = audits["server-response-time"]?.numericValue ?? null;
  const fcpMs = audits["first-contentful-paint"]?.numericValue ?? null;
  const lcpMs = audits["largest-contentful-paint"]?.numericValue ?? null;

  return {
    lcpMs: lcpMs != null ? Math.round(lcpMs) : null,
    fcpMs: fcpMs != null ? Math.round(fcpMs) : null,
    ttfbMs: ttfbMs != null ? Math.round(ttfbMs) : null,
    subparts: items,
    lcpElement: elementItems?.[0]?.items?.[0]?.node?.snippet ?? elementItems?.[0]?.node?.snippet ?? null,
  };
}

async function main() {
  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing Supabase env vars (values omitted).");
  }
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const beforeFp = await captureDevFingerprint();
  console.log("LH_BEFORE_FP:", JSON.stringify(beforeFp));

  let tempProcId: string | null = null;
  const results: any[] = [];

  try {
    const { data: existing } = await supabase
      .from("procedures")
      .select("id")
      .eq("slug", TEST_SLUG)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("procedures").delete().eq("id", existing.id);
    }

    const { data: proc, error } = await supabase
      .from("procedures")
      .insert({
        slug: TEST_SLUG,
        title: "Central Venous Pressure Measurement",
        short_description: "Lighthouse mobile performance test procedure.",
        definition: "Measures central venous pressure using a transducer.",
        published: true,
        sort_order: 998,
        video_status: "none",
      })
      .select("id")
      .single();

    if (error || !proc) {
      throw new Error(`Failed seeding LH procedure: ${error?.message}`);
    }
    tempProcId = proc.id;

    await supabase.from("checklist_steps").insert([
      {
        procedure_id: tempProcId,
        sort_order: 10,
        phase: "Setup",
        is_critical: true,
        text_en: "Level and zero the pressure transducer at the phlebostatic axis.",
        text_ar: "ضبط مستوى المحوّل وتصفيره عند المحور الوريدي.",
      },
    ]);

    const targets = [
      { key: "cover", name: "Cover (/)", url: `${BASE_URL}/` },
      { key: "home", name: "Home (/home)", url: `${BASE_URL}/home` },
      { key: "procedures", name: "Procedures (/procedures)", url: `${BASE_URL}/procedures` },
      {
        key: "detail",
        name: `Procedure (/procedures/${TEST_SLUG})`,
        url: `${BASE_URL}/procedures/${TEST_SLUG}`,
      },
      { key: "admin-login", name: "Admin Login (/admin/login)", url: `${BASE_URL}/admin/login` },
    ];

    for (const target of targets) {
      const runs: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const outFile = path.join(REPORTS_DIR, `${target.key}-run${i}.json`);
        const cmd = `npx lighthouse "${target.url}" --output=json --output-path="${outFile}" --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate --chrome-flags="--headless=new --no-sandbox" --quiet`;
        execSync(cmd, { stdio: "pipe", timeout: 180000 });

        const report = JSON.parse(fs.readFileSync(outFile, "utf8"));
        const cats = report.categories || {};
        const audits = report.audits || {};
        const lcpMs = audits["largest-contentful-paint"]?.numericValue ?? 0;
        const cls = audits["cumulative-layout-shift"]?.numericValue ?? 0;
        const tbt = audits["total-blocking-time"]?.numericValue ?? 0;
        const fcpMs = audits["first-contentful-paint"]?.numericValue ?? 0;

        runs.push({
          run: i,
          perf: Math.round((cats.performance?.score || 0) * 100),
          a11y: Math.round((cats.accessibility?.score || 0) * 100),
          bp: Math.round((cats["best-practices"]?.score || 0) * 100),
          seo: Math.round((cats.seo?.score || 0) * 100),
          lcpMs: Math.round(lcpMs),
          lcpSec: +(lcpMs / 1000).toFixed(2),
          cls: +cls.toFixed(4),
          tbtMs: Math.round(tbt),
          fcpMs: Math.round(fcpMs),
          breakdown: extractLcpBreakdown(audits),
        });
      }

      // Find the median run by LCP for exact representative breakdown
      const sortedByLcp = [...runs].sort((a, b) => a.lcpMs - b.lcpMs);
      const medianRun = sortedByLcp[Math.floor(sortedByLcp.length / 2)];

      results.push({
        page: target.name,
        runs: runs.map((r) => ({
          run: r.run,
          perf: r.perf,
          lcpSec: r.lcpSec,
          cls: r.cls,
          tbtMs: r.tbtMs,
          fcpMs: r.fcpMs,
          a11y: r.a11y,
          bp: r.bp,
          seo: r.seo,
        })),
        median: {
          perf: median(runs.map((r) => r.perf)),
          a11y: median(runs.map((r) => r.a11y)),
          bp: median(runs.map((r) => r.bp)),
          seo: median(runs.map((r) => r.seo)),
          lcpSec: median(runs.map((r) => r.lcpSec)),
          lcpMs: median(runs.map((r) => r.lcpMs)),
          cls: median(runs.map((r) => r.cls)),
          tbtMs: median(runs.map((r) => r.tbtMs)),
          fcpMs: median(runs.map((r) => r.fcpMs)),
        },
        medianRunBreakdown: medianRun.breakdown,
      });
    }

    for (const dir of REPORTS_DIRS) {
      try {
        fs.writeFileSync(
          path.join(dir, "lighthouse-summary.json"),
          JSON.stringify(results, null, 2)
        );
      } catch {}
    }
    console.log("LH_SUMMARY:", JSON.stringify(results, null, 2));
  } finally {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (tempProcId) {
          await supabase.from("checklist_steps").delete().eq("procedure_id", tempProcId);
          await supabase.from("procedures").delete().eq("id", tempProcId);
        } else {
          const { data: leftover } = await supabase
            .from("procedures")
            .select("id")
            .eq("slug", TEST_SLUG)
            .maybeSingle();
          if (leftover?.id) {
            await supabase.from("checklist_steps").delete().eq("procedure_id", leftover.id);
            await supabase.from("procedures").delete().eq("id", leftover.id);
          }
        }
        break;
      } catch (err: any) {
        console.warn(`[LH Cleanup attempt ${attempt}/3] ${err.message}`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    let afterFp: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        afterFp = await captureDevFingerprint();
        break;
      } catch (err: any) {
        console.warn(`[LH Fingerprint attempt ${attempt}/3] ${err.message}`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    if (!afterFp) {
      throw new Error("Failed to capture DEV fingerprint after 3 attempts");
    }

    const cmp = compareDevFingerprints(beforeFp, afterFp);
    console.log("LH_DEV_FINGERPRINT_COMPARE:", JSON.stringify(cmp));
    if (!cmp.matches) {
      throw new Error(`LH DEV cleanup mismatch: ${cmp.diffs.join("; ")}`);
    }
  }
}

main().catch((err) => {
  console.error("LH_FATAL:", err);
  process.exit(1);
});
