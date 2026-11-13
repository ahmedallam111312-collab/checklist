import fs from "fs";
import path from "path";
import { FullConfig } from "@playwright/test";
import { captureDevFingerprint, DevFingerprint } from "./dev-fingerprint";

export default async function globalSetup(config: FullConfig) {
  console.log("\n🔒 [DEV PROTECTION GLOBAL SETUP] Capturing DEV database fingerprint before test run...");
  
  const fingerprint = await captureDevFingerprint();
  
  // Ensure target directory exists
  const outputDir = path.join(process.cwd(), "test-results");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const snapshotPath = path.join(outputDir, "dev-fingerprint-before.json");
  fs.writeFileSync(snapshotPath, JSON.stringify(fingerprint, null, 2), "utf-8");

  console.log(`✅ DEV project '${fingerprint.projectRef}' pristine baseline captured at ${fingerprint.timestamp}:`);
  console.log(`   - procedures: ${fingerprint.counts.procedures} (max updated_at: ${fingerprint.maxUpdatedAt.procedures || "null"})`);
  console.log(`   - checklist_steps: ${fingerprint.counts.checklist_steps}`);
  console.log(`   - equipment_items: ${fingerprint.counts.equipment_items}`);
  console.log(`   - list_items: ${fingerprint.counts.list_items}`);
  console.log(`   - site_settings: ${fingerprint.counts.site_settings} (max updated_at: ${fingerprint.maxUpdatedAt.site_settings || "null"})`);
  console.log(`   - admins: ${fingerprint.counts.admins}`);
  console.log(`   - storage.objects (site-images): ${fingerprint.counts.storage_objects}`);
  console.log(`   - e2e-* procedures in DEV: ${fingerprint.counts.e2e_procedures}`);

  if (fingerprint.counts.e2e_procedures > 0) {
    throw new Error(
      `🛑 [DEV INTEGRITY FAILURE] DEV project already contains ${fingerprint.counts.e2e_procedures} 'e2e-%' procedure(s) prior to test run!`
    );
  }

  console.log(`   Snapshot saved to ${snapshotPath}\n`);
}
