import fs from "fs";
import path from "path";

// Function to calculate Shannon entropy of a string
function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const ch of str) {
    frequencies[ch] = (frequencies[ch] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(frequencies)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "test-results",
  "playwright-report",
  ".auth",
  "test-assets",
  ".agents",
]);

const IGNORED_FILES = new Set([
  ".env.local",
  ".env.development.local",
  ".env.test.local",
  ".env.production.local",
  ".env.test",
  "package-lock.json",
]);

// Binary / image extensions to skip
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".zip",
  ".pdf",
  ".mp4",
]);

const KNOWN_PLACEHOLDERS = new Set([
  "your-secret-key",
  "your-publishable-key",
  "your-admin-password",
  "admin123",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
]);

function getFiles(dir: string): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) || relPath.startsWith("tests/.auth")) {
        continue;
      }
      results = results.concat(getFiles(fullPath));
    } else {
      if (IGNORED_FILES.has(entry.name) || BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        continue;
      }
      results.push(fullPath);
    }
  }
  return results;
}

function runSecretsCheck() {
  const files = getFiles(process.cwd());
  const violations: { file: string; line: number; rule: string }[] = [];

  for (const file of files) {
    // Never read .env.local
    if (file.endsWith(".env.local")) continue;

    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const relFile = path.relative(process.cwd(), file).replace(/\\/g, "/");

      // 1. JWT-like string: eyJ...
      // (exclude check-secrets.ts itself when referencing the pattern)
      if (relFile !== "scripts/check-secrets.ts") {
        if (/eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}/.test(line)) {
          violations.push({ file: relFile, line: lineNum, rule: "JWT token detected (eyJ...)" });
        }

        // 2. sb_secret_ prefix
        if (line.includes("sb_secret_")) {
          violations.push({ file: relFile, line: lineNum, rule: "Supabase secret key prefix detected (sb_secret_)" });
        }

        // 3. Private key blocks (plain or base64)
        if (/BEGIN [A-Z0-9_-]*PRIVATE KEY/.test(line) || line.includes("LS0tLS1CRUdJTi")) {
          violations.push({ file: relFile, line: lineNum, rule: "Private key block detected" });
        }

        // 4. High-entropy secret assigned to variable containing KEY, SECRET, TOKEN, PASSWORD
        const secretAssignMatch = line.match(/(?:KEY|SECRET|TOKEN|PASSWORD)\s*[:=]\s*['"]?([A-Za-z0-9_\-+/=]{25,})['"]?/i);
        if (secretAssignMatch) {
          const val = secretAssignMatch[1];
          if (!KNOWN_PLACEHOLDERS.has(val)) {
            const entropy = calculateEntropy(val);
            if (entropy > 3.5) {
              violations.push({
                file: relFile,
                line: lineNum,
                rule: `High-entropy secret assignment detected (entropy: ${entropy.toFixed(2)})`,
              });
            }
          }
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error(`\n❌ [check:secrets] FAILED: Found ${violations.length} potential secret leak(s):`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} -> ${v.rule}`);
    }
    console.error("\nPlease purge all real secrets from tracked files.\n");
    process.exit(1);
  } else {
    console.log(`\n✅ [check:secrets] Scanned ${files.length} tracked files. Zero secrets or sensitive tokens detected.\n`);
    process.exit(0);
  }
}

runSecretsCheck();
