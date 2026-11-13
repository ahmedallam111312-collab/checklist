/**
 * Smoke test script for Critical Ease production deployment readiness.
 * Usage: npx tsx scripts/smoke-test.ts <baseUrl>
 * Example: npx tsx scripts/smoke-test.ts http://localhost:3000
 */

import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import { URL } from "url";

// Helper to extract secret from .env.local without ever printing or logging it
function getHealthSecret(): string | undefined {
  if (process.env.CRON_SECRET) return process.env.CRON_SECRET;
  if (process.env.HEALTH_CHECK_SECRET) return process.env.HEALTH_CHECK_SECRET;
  
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      const cronMatch = line.match(/^CRON_SECRET\s*=\s*(.*)$/);
      if (cronMatch) {
        return cronMatch[1].trim().replace(/^["']|["']$/g, "");
      }
      const healthMatch = line.match(/^HEALTH_CHECK_SECRET\s*=\s*(.*)$/);
      if (healthMatch) {
        return healthMatch[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  }
  return undefined;
}

interface CheckResult {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

const results: CheckResult[] = [];

async function makeRequest(
  urlStr: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    followRedirects?: boolean;
  } = {}
): Promise<{
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  finalUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const transport = parsedUrl.protocol === "https:" ? https : http;

    const reqOptions = {
      method: options.method || "GET",
      headers: options.headers || {},
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
    };

    const req = transport.request(reqOptions, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (
          options.followRedirects &&
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const redirectUrl = new URL(res.headers.location, urlStr).toString();
          resolve(makeRequest(redirectUrl, { ...options, followRedirects: false }));
        } else {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body: data,
            finalUrl: urlStr,
          });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

function recordCheck(name: string, expected: string, actual: string, passed: boolean, notes?: string) {
  results.push({ name, expected, actual, passed, notes });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${icon} [${name}]: ${actual} ${notes ? `(${notes})` : ""}`);
}

async function runSmokeTests(baseUrl: string) {
  console.log(`\n========================================================================`);
  console.log(`              CRITICAL EASE PRODUCTION SMOKE TESTS                      `);
  console.log(`Target URL: ${baseUrl}`);
  console.log(`========================================================================\n`);

  // 1. Public Pages (HTTP 200)
  console.log(`--- 1. Public Pages Status Check ---`);
  const publicPages = [
    { path: "/", name: "Home Page (/)" },
    { path: "/procedures", name: "Procedures Directory (/procedures)" },
    { path: "/about", name: "About Page (/about)" },
    { path: "/admin/login", name: "Admin Login Page (/admin/login)" },
  ];

  for (const page of publicPages) {
    try {
      const res = await makeRequest(`${baseUrl}${page.path}`);
      recordCheck(
        page.name,
        "HTTP 200",
        `HTTP ${res.statusCode}`,
        res.statusCode === 200
      );
    } catch (e: any) {
      recordCheck(page.name, "HTTP 200", `Error: ${e.message}`, false);
    }
  }

  // 2. Unpublished Procedure (HTTP 404)
  console.log(`\n--- 2. Unpublished / Non-existent Procedure 404 Check ---`);
  try {
    const slug = "this-does-not-exist";
    const res = await makeRequest(`${baseUrl}/procedures/${slug}`);
    recordCheck(
      "Unpublished Procedure (/procedures/this-does-not-exist)",
      "HTTP 404",
      `HTTP ${res.statusCode}`,
      res.statusCode === 404,
      `Slug: ${slug}`
    );
  } catch (e: any) {
    recordCheck("Unpublished Procedure", "HTTP 404", `Error: ${e.message}`, false);
  }

  // 3. Admin Protected Route Redirect
  console.log(`\n--- 3. Protected Admin Route Auth Redirect ---`);
  try {
    const res = await makeRequest(`${baseUrl}/admin`, { followRedirects: false });
    const location = (res.headers.location as string) || "";
    const isRedirect = res.statusCode === 307 || res.statusCode === 308 || res.statusCode === 302;
    const targetsLogin = location.includes("/admin/login");
    recordCheck(
      "Protected /admin Route",
      "HTTP 307/308 -> /admin/login",
      `HTTP ${res.statusCode} -> ${location || "none"}`,
      isRedirect && targetsLogin
    );
  } catch (e: any) {
    recordCheck("Protected /admin Route", "Redirect", `Error: ${e.message}`, false);
  }

  // 4. Health Check Endpoint (/api/health)
  console.log(`\n--- 4. Health Check Endpoint Authorization & Response ---`);
  try {
    // 4a. Unauthenticated request -> HTTP 401
    const unauthRes = await makeRequest(`${baseUrl}/api/health`);
    let unauthParsed: any = {};
    try {
      unauthParsed = JSON.parse(unauthRes.body);
    } catch {}
    recordCheck(
      "Health Endpoint Unauthenticated",
      "HTTP 401 Unauthorized",
      `HTTP ${unauthRes.statusCode} (${JSON.stringify(unauthParsed)})`,
      unauthRes.statusCode === 401 && unauthParsed.ok === false
    );

    // 4b. Authenticated request using CRON_SECRET or HEALTH_CHECK_SECRET
    const validSecret = getHealthSecret();
    if (validSecret) {
      const authRes = await makeRequest(`${baseUrl}/api/health`, {
        headers: {
          Authorization: `Bearer ${validSecret}`,
        },
      });
      let authParsed: any = {};
      try {
        authParsed = JSON.parse(authRes.body);
      } catch {}
      // Must be strictly { ok: true, db: true }
      const hasOnlyOkAndDb =
        authParsed.ok === true &&
        authParsed.db === true &&
        !("version" in authParsed) &&
        !("latency" in authParsed) &&
        !("stack" in authParsed);

      recordCheck(
        "Health Endpoint Authenticated (/api/health)",
        "HTTP 200 { ok: true, db: true }",
        `HTTP ${authRes.statusCode} (${JSON.stringify(authParsed)})`,
        authRes.statusCode === 200 && hasOnlyOkAndDb,
        "Protected by Bearer token, zero secret/version/latency leak"
      );
    } else {
      recordCheck(
        "Health Endpoint Authenticated (/api/health)",
        "HTTP 200 { ok: true, db: true }",
        "No secret found in environment or .env.local",
        false
      );
    }
  } catch (e: any) {
    recordCheck("Health Endpoint", "HTTP 401/200", `Error: ${e.message}`, false);
  }

  // 5. Security Headers
  console.log(`\n--- 5. Security Headers Verification ---`);
  try {
    const rootRes = await makeRequest(`${baseUrl}/`);
    const h = rootRes.headers;

    const csp = (h["content-security-policy"] as string) || "";
    recordCheck(
      "Content-Security-Policy",
      "Present with mux.com / supabase.co",
      csp ? `Present (${csp.length} chars)` : "Missing",
      Boolean(csp && csp.includes("mux.com"))
    );

    const xfo = (h["x-frame-options"] as string) || "";
    recordCheck(
      "X-Frame-Options",
      "DENY",
      xfo || "Missing",
      xfo.toUpperCase() === "DENY"
    );

    const xcto = (h["x-content-type-options"] as string) || "";
    recordCheck(
      "X-Content-Type-Options",
      "nosniff",
      xcto || "Missing",
      xcto.toLowerCase() === "nosniff"
    );

    const rp = (h["referrer-policy"] as string) || "";
    recordCheck(
      "Referrer-Policy",
      "strict-origin-when-cross-origin",
      rp || "Missing",
      rp === "strict-origin-when-cross-origin"
    );

    const pp = (h["permissions-policy"] as string) || "";
    recordCheck(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
      pp || "Missing",
      Boolean(pp && pp.includes("camera=()"))
    );

    // Admin & API routes X-Robots-Tag: noindex
    const adminRes = await makeRequest(`${baseUrl}/admin/login`);
    const adminRobots = (adminRes.headers["x-robots-tag"] as string) || "";
    recordCheck(
      "X-Robots-Tag on /admin/login",
      "noindex",
      adminRobots || "Missing",
      adminRobots.includes("noindex")
    );

    const apiRes = await makeRequest(`${baseUrl}/api/health`);
    const apiRobots = (apiRes.headers["x-robots-tag"] as string) || "";
    recordCheck(
      "X-Robots-Tag on /api routes",
      "noindex",
      apiRobots || "Missing",
      apiRobots.includes("noindex")
    );
  } catch (e: any) {
    recordCheck("Security Headers", "Headers Present", `Error: ${e.message}`, false);
  }

  // 6. Robots.txt and Sitemap.xml
  console.log(`\n--- 6. Robots.txt and Sitemap.xml Verification ---`);
  try {
    const robotsRes = await makeRequest(`${baseUrl}/robots.txt`);
    const robotsHasAdminDisallow = robotsRes.body.includes("Disallow: /admin");
    const robotsHasApiDisallow = robotsRes.body.includes("Disallow: /api");
    const robotsHasSitemap = robotsRes.body.includes("sitemap.xml");

    recordCheck(
      "robots.txt",
      "HTTP 200, Disallow /admin and /api, declares Sitemap",
      `HTTP ${robotsRes.statusCode}`,
      robotsRes.statusCode === 200 && robotsHasAdminDisallow && robotsHasApiDisallow && robotsHasSitemap
    );

    const sitemapRes = await makeRequest(`${baseUrl}/sitemap.xml`);
    const sitemapIsXml = sitemapRes.body.includes("<urlset") || sitemapRes.body.includes("xmlns");
    const sitemapHasHome = sitemapRes.body.includes("<loc>");

    recordCheck(
      "sitemap.xml",
      "HTTP 200, valid XML urlset with public URLs",
      `HTTP ${sitemapRes.statusCode}`,
      sitemapRes.statusCode === 200 && sitemapIsXml && sitemapHasHome
    );
  } catch (e: any) {
    recordCheck("Robots & Sitemap", "Valid", `Error: ${e.message}`, false);
  }

  // 7. Server Environment Variables Leak Scan in Served Responses
  console.log(`\n--- 7. Zero Server Env Secrets in Served Content ---`);
  try {
    const pagesToScan = ["/", "/procedures", "/about", "/admin/login"];
    const serverVarNames = [
      "SUPABASE_SECRET_KEY",
      "CRON_SECRET",
      "HEALTH_CHECK_SECRET",
      "MUX_TOKEN_SECRET",
      "MUX_SIGNING_PRIVATE_KEY",
      "MUX_WEBHOOK_SECRET",
      "DATABASE_URL",
      "E2E_ADMIN_PASSWORD",
    ];
    const secretPrefixes = ["sb" + "p_", "service" + "_role", "sb_" + "secret_"];

    let leaksFound = 0;
    const scriptUrls: string[] = [];

    for (const p of pagesToScan) {
      const res = await makeRequest(`${baseUrl}${p}`);
      const body = res.body;

      // Extract script src
      const scriptMatches = body.matchAll(/src="(\/_next\/static\/[^"]+)"/g);
      for (const m of scriptMatches) {
        if (!scriptUrls.includes(m[1])) {
          scriptUrls.push(m[1]);
        }
      }

      for (const varName of serverVarNames) {
        if (body.includes(varName)) {
          leaksFound++;
          console.error(`  [LEAK] Found ${varName} in ${p}`);
        }
      }
      for (const prefix of secretPrefixes) {
        if (body.includes(prefix)) {
          leaksFound++;
          console.error(`  [LEAK] Found secret prefix "${prefix}" in ${p}`);
        }
      }
    }

    // Also scan up to 10 referenced client JS chunks
    for (const scriptPath of scriptUrls.slice(0, 15)) {
      const res = await makeRequest(`${baseUrl}${scriptPath}`);
      for (const varName of serverVarNames) {
        if (res.body.includes(varName)) {
          leaksFound++;
          console.error(`  [LEAK] Found ${varName} in client JS chunk ${scriptPath}`);
        }
      }
      for (const prefix of secretPrefixes) {
        if (res.body.includes(prefix)) {
          leaksFound++;
          console.error(`  [LEAK] Found prefix "${prefix}" in client JS chunk ${scriptPath}`);
        }
      }
    }

    recordCheck(
      "Server Secret & Variable Leak Scan",
      "0 server secrets in HTML/JS",
      `${leaksFound} leaks found (${pagesToScan.length} pages + ${Math.min(scriptUrls.length, 15)} scripts scanned)`,
      leaksFound === 0
    );
  } catch (e: any) {
    recordCheck("Secret Leak Scan", "0 leaks", `Error: ${e.message}`, false);
  }

  // Summary
  console.log(`\n========================================================================`);
  const allPassed = results.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`SMOKE TEST RESULT: ${passedCount}/${results.length} CHECKS PASSED`);
  if (allPassed) {
    console.log(`STATUS: ✅ ALL SMOKE CHECKS PASSED`);
  } else {
    console.log(`STATUS: ❌ SOME CHECKS FAILED`);
  }
  console.log(`========================================================================\n`);

  if (!allPassed) {
    process.exit(1);
  }
}

const targetUrl = process.argv[2] || "http://localhost:3000";
runSmokeTests(targetUrl).catch((err) => {
  console.error("Fatal error running smoke tests:", err);
  process.exit(1);
});
