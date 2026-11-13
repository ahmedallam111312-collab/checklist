import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

describe("T6 Production Build Hygiene: Demo Admin Credentials Absence & Freshness", () => {
  it("verifies production .next build exists and is fresher than all files in src/", () => {
    const buildManifest = path.join(process.cwd(), ".next", "build-manifest.json");
    assert.equal(
      fs.existsSync(buildManifest),
      true,
      "Fresh .next/build-manifest.json must exist"
    );

    const manifestStat = fs.statSync(buildManifest);

    let newestSrcMtimeMs = 0;
    let newestSrcFile = "";

    function findNewestSrc(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findNewestSrc(full);
        } else {
          const stat = fs.statSync(full);
          if (stat.mtimeMs > newestSrcMtimeMs) {
            newestSrcMtimeMs = stat.mtimeMs;
            newestSrcFile = full;
          }
        }
      }
    }

    findNewestSrc(path.join(process.cwd(), "src"));

    assert.ok(
      manifestStat.mtimeMs >= newestSrcMtimeMs,
      `.next build (${manifestStat.mtime.toISOString()}) must be newer than newest src file ${newestSrcFile} (${new Date(newestSrcMtimeMs).toISOString()})`
    );
  });

  it("ensures demo admin credentials are never compiled into .next client bundles (.next/static)", () => {
    const nextStaticDir = path.join(process.cwd(), ".next", "static");
    assert.equal(fs.existsSync(nextStaticDir), true, ".next/static directory must exist");

    const TARGET_CREDENTIALS = [
      "admin@criticalease.local",
      "AdminPass123!",
      "admin@criticalease.ps",
      "TestAdmin123!Safe",
      "admin@example.com",
      "your-admin-password",
    ];

    const violations: string[] = [];
    let filesScanned = 0;

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith(".js") || entry.name.endsWith(".json")) {
          filesScanned++;
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const target of TARGET_CREDENTIALS) {
            if (content.includes(target)) {
              violations.push(`Leaked demo credential '${target}' in client file: ${fullPath}`);
            }
          }
        }
      }
    }

    scanDir(nextStaticDir);

    assert.ok(filesScanned > 0, "Must scan at least 1 static bundle file");
    assert.equal(
      violations.length,
      0,
      `Found demo admin credentials in production client static build output:\n${violations.join("\n")}`
    );
  });

  it("ensures demo admin credentials are never compiled into .next server build output (.next/server)", () => {
    const nextServerDir = path.join(process.cwd(), ".next", "server");
    assert.equal(fs.existsSync(nextServerDir), true, ".next/server directory must exist");

    const TARGET_CREDENTIALS = [
      "admin@criticalease.local",
      "AdminPass123!",
      "admin@criticalease.ps",
      "TestAdmin123!Safe",
      "admin@example.com",
      "your-admin-password",
    ];

    const violations: string[] = [];
    let filesScanned = 0;

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith(".js") || entry.name.endsWith(".json")) {
          filesScanned++;
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const target of TARGET_CREDENTIALS) {
            if (content.includes(target)) {
              violations.push(`Leaked demo credential '${target}' in server build file: ${fullPath}`);
            }
          }
        }
      }
    }

    scanDir(nextServerDir);

    assert.ok(filesScanned > 0, "Must scan at least 1 server build file");
    assert.equal(
      violations.length,
      0,
      `Found demo admin credentials in production server build output:\n${violations.join("\n")}`
    );
  });
});
