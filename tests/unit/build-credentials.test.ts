import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

describe("T6 Production Build Hygiene: Demo Admin Credentials Absence", () => {
  it("ensures demo admin email and password are never compiled into .next client bundles", () => {
    const nextStaticDir = path.join(process.cwd(), ".next", "static");
    if (!fs.existsSync(nextStaticDir)) {
      // If build does not exist yet, skip with warning
      return;
    }

    const DEMO_EMAIL = "admin@profnurse.local";
    const DEMO_PASS = "AdminPass123!";

    const violations: string[] = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith(".js")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (content.includes(DEMO_EMAIL)) {
            violations.push(`Leaked demo email in client bundle: ${fullPath}`);
          }
          if (content.includes(DEMO_PASS)) {
            violations.push(`Leaked demo password in client bundle: ${fullPath}`);
          }
        }
      }
    }

    scanDir(nextStaticDir);

    assert.equal(
      violations.length,
      0,
      `Found demo admin credentials in production build output:\n${violations.join("\n")}`
    );
  });
});
