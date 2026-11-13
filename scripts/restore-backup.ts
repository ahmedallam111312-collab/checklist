/**
 * Database Backup Restore Script (Dev & Disaster Recovery Only)
 *
 * Usage:
 *   npx tsx scripts/restore-backup.ts <backup-file.json>          (Dry-run by default)
 *   npx tsx scripts/restore-backup.ts <backup-file.json> --apply  (Applies changes)
 *
 * Rules:
 * - Upsert by id, never deletes existing data
 * - Prints counts of records inspected and restored per table
 * - Uses SUPABASE_SECRET_KEY from environment
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

interface BackupFile {
  version: number;
  exported_at: string;
  tables: {
    site_settings?: any[];
    procedures?: any[];
    list_items?: any[];
    equipment_items?: any[];
    checklist_steps?: any[];
  };
}

export async function runRestore(filePath: string, apply: boolean = false) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found at: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const data: BackupFile = JSON.parse(raw);

  if (!data.tables) {
    throw new Error("Invalid backup format: missing 'tables' key.");
  }

  console.log("==================================================");
  console.log(`Critical Ease Backup Restore Engine (${apply ? "APPLY MODE" : "DRY RUN"})`);
  console.log("==================================================");
  console.log(`File: ${filePath}`);
  console.log(`Exported At: ${data.exported_at}`);
  console.log(`Backup Version: ${data.version}`);
  console.log("--------------------------------------------------");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in environment.");
  }

  const client = createClient(supabaseUrl, secretKey);

  const tableOrder = [
    "site_settings",
    "procedures",
    "list_items",
    "equipment_items",
    "checklist_steps",
  ] as const;

  const summary: Record<string, { read: number; applied: number }> = {};

  for (const tableName of tableOrder) {
    const rows = data.tables[tableName] || [];
    summary[tableName] = { read: rows.length, applied: 0 };

    console.log(`\nTable [${tableName}]: ${rows.length} rows found in backup`);

    if (rows.length === 0) continue;

    if (!apply) {
      console.log(`  -> [DRY RUN] Would upsert ${rows.length} rows into ${tableName}`);
      summary[tableName].applied = rows.length;
    } else {
      // Upsert by id
      const { data: upserted, error } = await client
        .from(tableName)
        .upsert(rows, { onConflict: "id" })
        .select("id");

      if (error) {
        throw new Error(`Failed to restore ${tableName}: ${error.message}`);
      }
      summary[tableName].applied = upserted?.length || rows.length;
      console.log(`  -> [APPLIED] Successfully upserted ${summary[tableName].applied} rows into ${tableName}`);
    }
  }

  console.log("\n--------------------------------------------------");
  console.log("Restore Summary:");
  for (const [tbl, stats] of Object.entries(summary)) {
    console.log(`  - ${tbl.padEnd(16)}: ${stats.read} in backup | ${stats.applied} ${apply ? "upserted" : "would upsert"}`);
  }
  console.log("--------------------------------------------------");
  if (!apply) {
    console.log("ℹ To write these changes to the database, run with '--apply'.\n");
  } else {
    console.log("✅ Backup restored successfully.\n");
  }

  return summary;
}

// CLI Execution entrypoint
if (process.argv[1] && process.argv[1].includes("restore-backup")) {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => !a.startsWith("--"));
  const applyFlag = args.includes("--apply");

  if (!fileArg) {
    console.error("Usage: tsx scripts/restore-backup.ts <path-to-backup.json> [--apply]");
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), fileArg);
  runRestore(resolved, applyFlag).catch((err) => {
    console.error("❌ Restore failed:", err.message);
    process.exit(1);
  });
}
