import { execSync } from "child_process";

interface StepResult {
  name: string;
  command: string;
  status: "PASSED" | "FAILED";
  durationMs: number;
  error?: string;
  details?: string;
}

function runStep(name: string, command: string): StepResult {
  const start = Date.now();
  try {
    const stdout = execSync(command, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
    });
    const durationMs = Date.now() - start;
    let details = "";
    if (name === "Unit Test Suite") {
      const match = stdout.match(/pass\s+(\d+)/);
      if (match) details = `(${match[1]} tests)`;
    } else if (name === "Secret Leak Audit") {
      const match = stdout.match(/Scanned\s+(\d+)\s+tracked files/);
      if (match) details = `(${match[1]} files scanned)`;
    }
    return { name, command, status: "PASSED", durationMs, details };
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    let errorOutput = "";
    if (err && typeof err === "object") {
      const anyErr = err as Record<string, unknown>;
      errorOutput = String(anyErr.stderr || anyErr.stdout || anyErr.message || err);
    } else {
      errorOutput = String(err);
    }
    return { name, command, status: "FAILED", durationMs, error: errorOutput.slice(0, 500) };
  }
}

async function main() {
  console.log("Starting Critical Ease Preflight Verification...\n");

  const steps = [
    { name: "Secret Leak Audit", command: "npm run check:secrets" },
    { name: "TypeScript Check", command: "npm run typecheck" },
    { name: "ESLint Verification", command: "npm run lint" },
    { name: "Unit Test Suite", command: "npm run test:unit" },
    { name: "Production Build", command: "npm run build" },
  ];

  const results: StepResult[] = [];
  let allPassed = true;

  for (const step of steps) {
    process.stdout.write(`• Running ${step.name}... `);
    const res = runStep(step.name, step.command);
    results.push(res);
    if (res.status === "PASSED") {
      console.log(`✅ PASSED (${(res.durationMs / 1000).toFixed(1)}s) ${res.details || ""}`);
    } else {
      console.log(`❌ FAILED (${(res.durationMs / 1000).toFixed(1)}s)`);
      if (res.error) {
        console.error(`\n--- Error details for ${res.name} ---\n${res.error}\n`);
      }
      allPassed = false;
      break;
    }
  }

  console.log("\n" + "=".repeat(74));
  console.log("                   CRITICAL EASE PREFLIGHT AUDIT SUMMARY");
  console.log("=".repeat(74));
  console.log(
    "Step".padEnd(28) +
    "Status".padEnd(12) +
    "Duration".padEnd(14) +
    "Notes"
  );
  console.log("-".repeat(74));

  for (const r of results) {
    const dur = `${(r.durationMs / 1000).toFixed(1)}s`;
    console.log(
      r.name.padEnd(28) +
      r.status.padEnd(12) +
      dur.padEnd(14) +
      (r.details || (r.status === "FAILED" ? "See error log" : "OK"))
    );
  }

  console.log("-".repeat(74));
  if (allPassed) {
    console.log("OVERALL RESULT: ✅ ALL PREFLIGHT CHECKS PASSED — READY FOR DEPLOYMENT");
  } else {
    console.log("OVERALL RESULT: ❌ PREFLIGHT CHECKS FAILED — FIX ISSUES BEFORE DEPLOYING");
  }
  console.log("=".repeat(74) + "\n");

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Unexpected error in preflight:", e);
  process.exit(1);
});
