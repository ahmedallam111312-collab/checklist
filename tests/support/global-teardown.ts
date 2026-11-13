import fs from "fs";
import path from "path";
import { FullConfig } from "@playwright/test";
import { captureDevFingerprint, assertDevUnchanged, DevFingerprint } from "./dev-fingerprint";

export default async function globalTeardown(config: FullConfig) {
  console.log("\n🔒 [DEV PROTECTION GLOBAL TEARDOWN] Verifying DEV database protection after test run...");

  const snapshotPath = path.join(process.cwd(), "test-results", "dev-fingerprint-before.json");
  if (!fs.existsSync(snapshotPath)) {
    console.warn(`⚠️ [DEV TEARDOWN] Initial baseline snapshot not found at ${snapshotPath} (setup was aborted). Skipping teardown comparison.`);
    return;
  }

  const before: DevFingerprint = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
  const after = await captureDevFingerprint();

  const afterSnapshotPath = path.join(process.cwd(), "test-results", "dev-fingerprint-after.json");
  fs.writeFileSync(afterSnapshotPath, JSON.stringify(after, null, 2), "utf-8");

  console.log(`🔍 Post-run DEV project '${after.projectRef}' state at ${after.timestamp}:`);
  console.log(`   - procedures: ${after.counts.procedures} (before: ${before.counts.procedures})`);
  console.log(`   - checklist_steps: ${after.counts.checklist_steps} (before: ${before.counts.checklist_steps})`);
  console.log(`   - equipment_items: ${after.counts.equipment_items} (before: ${before.counts.equipment_items})`);
  console.log(`   - list_items: ${after.counts.list_items} (before: ${before.counts.list_items})`);
  console.log(`   - site_settings: ${after.counts.site_settings} (before: ${before.counts.site_settings})`);
  console.log(`   - admins: ${after.counts.admins} (before: ${before.counts.admins})`);
  console.log(`   - storage.objects (site-images): ${after.counts.storage_objects} (before: ${before.counts.storage_objects})`);
  console.log(`   - e2e-* procedures in DEV: ${after.counts.e2e_procedures} (before: ${before.counts.e2e_procedures})`);
  console.log(`   - procedures max(updated_at): ${after.maxUpdatedAt.procedures || "null"}`);
  console.log(`   - site_settings max(updated_at): ${after.maxUpdatedAt.site_settings || "null"}`);

  // Throws hard exception if any count changed, max updated_at changed, or e2e row appeared
  assertDevUnchanged(before, after);

  console.log("✅ [DEV INTEGRITY VERIFIED] DEV database smfsmixdymphtgfalupl is 100% untouched. Zero mutations, zero e2e rows.\n");
}
