import fs from "fs";
import path from "path";
import {
  captureDevFingerprint,
  assertDevUnchanged,
  compareDevFingerprints,
  DevFingerprint,
  DEV_PROJECT_REF,
} from "../tests/support/dev-fingerprint";

async function main() {
  const args = process.argv.slice(2);
  const isSnapshot = args.includes("--snapshot");
  const isCompare = args.includes("--compare");

  const outputDir = path.join(process.cwd(), "test-results");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const beforeSnapshotPath = path.join(outputDir, "dev-fingerprint-before.json");
  const afterSnapshotPath = path.join(outputDir, "dev-fingerprint-after.json");

  console.log(`\n======================================================`);
  console.log(`🔒 DEV Project Fingerprint Verification (${DEV_PROJECT_REF})`);
  console.log(`======================================================\n`);

  if (isSnapshot) {
    console.log(`[MODE: SNAPSHOT] Reading DEV project baseline...`);
    const fingerprint = await captureDevFingerprint();
    fs.writeFileSync(beforeSnapshotPath, JSON.stringify(fingerprint, null, 2), "utf-8");

    console.log(`✅ Pristine DEV baseline captured:`);
    printFingerprintSummary(fingerprint);

    if (fingerprint.counts.e2e_procedures > 0) {
      console.error(`\n❌ CRITICAL: DEV project already contains ${fingerprint.counts.e2e_procedures} 'e2e-%' procedure(s)!`);
      process.exit(1);
    }
    console.log(`\nBaseline snapshot written to: ${beforeSnapshotPath}`);
    process.exit(0);
  }

  if (isCompare) {
    console.log(`[MODE: COMPARE] Verifying DEV project against snapshot...`);
    if (!fs.existsSync(beforeSnapshotPath)) {
      console.error(`\n❌ Error: Snapshot not found at ${beforeSnapshotPath}. Run with --snapshot first.`);
      process.exit(1);
    }

    const before: DevFingerprint = JSON.parse(fs.readFileSync(beforeSnapshotPath, "utf-8"));
    const after = await captureDevFingerprint();
    fs.writeFileSync(afterSnapshotPath, JSON.stringify(after, null, 2), "utf-8");

    console.log(`Current DEV state:`);
    printFingerprintSummary(after);

    const { matches, diffs } = compareDevFingerprints(before, after);
    if (!matches) {
      console.error(`\n❌ [DEV INTEGRITY FAILURE] Detected ${diffs.length} discrepancy(ies):`);
      for (const diff of diffs) {
        console.error(`   - ${diff}`);
      }
      process.exit(1);
    }

    console.log(`\n✅ [VERIFICATION PASS] DEV database '${DEV_PROJECT_REF}' is 100% identical. 0 mutations detected.`);
    process.exit(0);
  }

  // Default: Capture, verify e2e=0, and compare if snapshot exists
  console.log(`[MODE: VERIFY] Querying DEV project in read-only mode...`);
  const current = await captureDevFingerprint();
  printFingerprintSummary(current);

  if (current.counts.e2e_procedures > 0) {
    console.error(`\n❌ CRITICAL INTEGRITY VIOLATION: Found ${current.counts.e2e_procedures} 'e2e-%' procedure(s) in DEV project!`);
    process.exit(1);
  }

  if (fs.existsSync(beforeSnapshotPath)) {
    console.log(`\nComparing against existing baseline snapshot (${beforeSnapshotPath})...`);
    const before: DevFingerprint = JSON.parse(fs.readFileSync(beforeSnapshotPath, "utf-8"));
    const { matches, diffs } = compareDevFingerprints(before, current);
    if (!matches) {
      console.error(`\n❌ [DEV INTEGRITY FAILURE] Detected ${diffs.length} discrepancy(ies):`);
      for (const diff of diffs) {
        console.error(`   - ${diff}`);
      }
      process.exit(1);
    }
    console.log(`✅ Current state perfectly matches baseline snapshot.`);
  } else {
    // Write snapshot since none existed
    fs.writeFileSync(beforeSnapshotPath, JSON.stringify(current, null, 2), "utf-8");
    console.log(`\nBaseline snapshot created at ${beforeSnapshotPath}`);
  }

  console.log(`\n✅ DEV database protection verified: project '${DEV_PROJECT_REF}' remains in pristine condition.`);
  console.log(`======================================================\n`);
}

function printFingerprintSummary(fp: DevFingerprint) {
  console.log(`Project Ref:      ${fp.projectRef}`);
  console.log(`Timestamp:        ${fp.timestamp}`);
  console.log(`procedures:       ${fp.counts.procedures} (max updated_at: ${fp.maxUpdatedAt.procedures || "null"})`);
  console.log(`checklist_steps:  ${fp.counts.checklist_steps}`);
  console.log(`equipment_items:  ${fp.counts.equipment_items}`);
  console.log(`list_items:       ${fp.counts.list_items}`);
  console.log(`site_settings:    ${fp.counts.site_settings} (max updated_at: ${fp.maxUpdatedAt.site_settings || "null"})`);
  console.log(`admins:           ${fp.counts.admins}`);
  console.log(`storage_objects:  ${fp.counts.storage_objects} (bucket: site-images)`);
  console.log(`e2e-* procedures: ${fp.counts.e2e_procedures}`);
}

main().catch((err) => {
  console.error("\n❌ DEV fingerprint verification encountered an unhandled error:");
  console.error(err.message || err);
  process.exit(1);
});
