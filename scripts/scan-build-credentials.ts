import fs from "fs";
import path from "path";

export interface ScanResult {
  directory: string;
  filesScanned: number;
  totalBytesScanned: number;
  files: string[];
  matches: Array<{
    file: string;
    target: string;
  }>;
}

export const TARGET_CREDENTIALS: string[] = [
  "admin@criticalease.local",
  "AdminPass123!",
  "admin@criticalease.ps",
  "TestAdmin123!Safe",
  "admin@example.com",
  "your-admin-password",
];

export function scanDirectoryForCredentials(
  rootDir: string,
  targets: string[] = TARGET_CREDENTIALS
): ScanResult {
  let filesScanned = 0;
  let totalBytesScanned = 0;
  const files: string[] = [];
  const matches: Array<{ file: string; target: string }> = [];

  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        filesScanned++;
        const content = fs.readFileSync(fullPath, "utf-8");
        totalBytesScanned += Buffer.byteLength(content, "utf-8");
        const relPath = path.relative(process.cwd(), fullPath);
        files.push(relPath);

        for (const target of targets) {
          if (content.includes(target)) {
            matches.push({ file: relPath, target });
          }
        }
      }
    }
  }

  walk(rootDir);

  return {
    directory: rootDir,
    filesScanned,
    totalBytesScanned,
    files,
    matches,
  };
}

export function runFullBuildScan() {
  console.log("======================================================");
  console.log("🔍 Exhaustive Build Credential Leak Scanner (R5 / K4 / T6)");
  console.log("======================================================\n");

  const staticDir = path.join(process.cwd(), ".next", "static");
  const serverDir = path.join(process.cwd(), ".next", "server");

  console.log("Target Credentials Searched:");
  TARGET_CREDENTIALS.forEach((c) => console.log(`  - ${c}`));
  console.log("");

  console.log(`[1/2] Scanning client static assets (.next/static)...`);
  const staticResult = scanDirectoryForCredentials(staticDir);
  console.log(`  Files scanned: ${staticResult.filesScanned}`);
  console.log(`  Total bytes scanned: ${staticResult.totalBytesScanned.toLocaleString()} bytes`);
  console.log(`  Violations found: ${staticResult.matches.length}`);

  if (staticResult.matches.length > 0) {
    console.error("❌ VIOLATIONS FOUND IN .next/static:");
    staticResult.matches.forEach((m) => console.error(`  - In ${m.file}: Found target '${m.target}'`));
  } else {
    console.log("  ✅ .next/static is 100% clean. Zero credential leaks detected.");
  }

  console.log(`\n[2/2] Scanning server build output (.next/server)...`);
  const serverResult = scanDirectoryForCredentials(serverDir);
  console.log(`  Files scanned: ${serverResult.filesScanned}`);
  console.log(`  Total bytes scanned: ${serverResult.totalBytesScanned.toLocaleString()} bytes`);
  console.log(`  Violations found: ${serverResult.matches.length}`);

  if (serverResult.matches.length > 0) {
    console.error("❌ VIOLATIONS FOUND IN .next/server:");
    serverResult.matches.forEach((m) => console.error(`  - In ${m.file}: Found target '${m.target}'`));
  } else {
    console.log("  ✅ .next/server is 100% clean. Zero demo credentials detected.");
  }

  console.log("\n======================================================");
  const totalViolations = staticResult.matches.length + serverResult.matches.length;
  if (totalViolations === 0) {
    console.log("🎉 ALL BUILDS VERIFIED CLEAN: PASS");
    console.log("======================================================");
    return true;
  } else {
    console.error(`🛑 FAILED: ${totalViolations} credential leak violation(s) detected.`);
    console.log("======================================================");
    return false;
  }
}

if (require.main === module || process.argv[1]?.includes("scan-build-credentials")) {
  const success = runFullBuildScan();
  if (!success) {
    process.exit(1);
  }
}
