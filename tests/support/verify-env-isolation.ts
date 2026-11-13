import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { loadEnvConfig } from "@next/env";

export function testEnvIsolation() {
  console.log("\n======================================================");
  console.log("🧪 Empirical Proof: @next/env Isolation with NODE_ENV=test");
  console.log("======================================================\n");

  // Verify .env.local actually exists on disk so this is not a false-negative
  const envLocalPath = path.join(process.cwd(), ".env.local");
  const envLocalExists = fs.existsSync(envLocalPath);
  console.log(`Precondition check: Does .env.local exist on disk? ${envLocalExists ? "YES" : "NO"}`);
  assert.equal(envLocalExists, true, "Precondition failed: .env.local must exist to prove exclusion");

  // Step 1: Set process.env.NODE_ENV = "test"
  (process.env as Record<string, string | undefined>).NODE_ENV = "test";

  // Step 2: Call loadEnvConfig
  const result = loadEnvConfig(process.cwd());
  const loadedPaths = result.loadedEnvFiles.map((f) => f.path);

  console.log(`Current process.env.NODE_ENV: '${process.env.NODE_ENV}'`);
  console.log(`Environment files loaded by @next/env:`, loadedPaths);

  // Assert .env.local is NOT in loadedPaths
  const loadedEnvLocal = loadedPaths.some((p) => p.endsWith(".env.local"));
  console.log(`Was .env.local loaded under NODE_ENV='test'? ${loadedEnvLocal ? "YES (VIOLATION)" : "NO (STRICTLY EXCLUDED)"}`);

  assert.equal(
    loadedEnvLocal,
    false,
    "CRITICAL SAFETY VIOLATION: .env.local was loaded under NODE_ENV=test!"
  );

  console.log("\n@next/env source code mechanism confirmation:");
  console.log("  In @next/env/dist/index.js line 1:");
  console.log('    const c = process.env.NODE_ENV === "test";');
  console.log('    const d = c ? "test" : dev ? "development" : "production";');
  console.log('    const f = [`.env.${d}.local`, d !== "test" && `.env.local`, `.env.${d}`, ".env"].filter(Boolean);');
  console.log('  When NODE_ENV === "test", d is "test".');
  console.log('  Therefore: (d !== "test" && ".env.local") evaluates to (false && ".env.local") -> FALSE.');
  console.log("  Filtering by Boolean removes false, completely eliminating '.env.local'.");

  console.log("\n✅ Proof confirmed: When NODE_ENV === 'test', @next/env strictly excludes '.env.local'.");
  console.log("======================================================\n");
}

if (require.main === module || process.argv[1]?.includes("verify-env-isolation")) {
  testEnvIsolation();
}
