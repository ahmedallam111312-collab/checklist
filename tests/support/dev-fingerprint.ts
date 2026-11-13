import fs from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const DEV_PROJECT_REF = "smfsmixdymphtgfalupl";

export interface DevFingerprint {
  projectRef: string;
  timestamp: string;
  counts: {
    procedures: number;
    checklist_steps: number;
    equipment_items: number;
    list_items: number;
    site_settings: number;
    admins: number;
    storage_objects: number;
    e2e_procedures: number;
  };
  maxUpdatedAt: {
    procedures: string | null;
    site_settings: string | null;
  };
}

export function extractProjectRef(supabaseUrl: string): string {
  try {
    const url = new URL(supabaseUrl);
    const hostParts = url.hostname.split(".");
    return hostParts[0] || "";
  } catch {
    return "";
  }
}

/**
 * Safely extracts DEV credentials from .env.local without ever printing or logging secrets.
 */
export function getDevCredentials(): { url: string; key: string } {
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envLocalPath)) {
    throw new Error("Cannot capture DEV fingerprint: .env.local does not exist.");
  }

  const content = fs.readFileSync(envLocalPath, "utf-8");
  let url = "";
  let secretKey = "";
  let pubKey = "";

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [keyPart, ...valParts] = trimmed.split("=");
    const key = keyPart.trim();
    const val = valParts.join("=").trim().replace(/^["']|["']$/g, "");

    if (key === "NEXT_PUBLIC_SUPABASE_URL") {
      url = val;
    } else if (key === "SUPABASE_SECRET_KEY") {
      secretKey = val;
    } else if (key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" || key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      pubKey = val;
    }
  }

  const effectiveKey = secretKey || pubKey;
  if (!url || !effectiveKey) {
    throw new Error("Cannot capture DEV fingerprint: missing Supabase URL or key in .env.local.");
  }

  const projectRef = extractProjectRef(url);
  if (projectRef !== DEV_PROJECT_REF) {
    throw new Error(
      `DEV project ref mismatch: expected '${DEV_PROJECT_REF}', but found '${projectRef}'.`
    );
  }

  return { url, key: effectiveKey };
}

/**
 * Creates a read-only Supabase client targeting the DEV project.
 */
export function getDevSupabaseClient(): SupabaseClient {
  const { url, key } = getDevCredentials();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Reads the pristine fingerprint of DEV project `smfsmixdymphtgfalupl` strictly using read-only SELECT queries.
 */
export async function captureDevFingerprint(): Promise<DevFingerprint> {
  const supabase = getDevSupabaseClient();

  // 1. Row counts
  const [
    procRes,
    stepsRes,
    equipRes,
    listRes,
    settingsRes,
    adminsRes,
    e2eProcRes,
  ] = await Promise.all([
    supabase.from("procedures").select("*", { count: "exact", head: true }),
    supabase.from("checklist_steps").select("*", { count: "exact", head: true }),
    supabase.from("equipment_items").select("*", { count: "exact", head: true }),
    supabase.from("list_items").select("*", { count: "exact", head: true }),
    supabase.from("site_settings").select("*", { count: "exact", head: true }),
    supabase.from("admins").select("*", { count: "exact", head: true }),
    supabase.from("procedures").select("*", { count: "exact", head: true }).like("slug", "e2e-%"),
  ]);

  if (procRes.error) throw new Error(`DEV procedures query failed: ${procRes.error.message}`);
  if (stepsRes.error) throw new Error(`DEV checklist_steps query failed: ${stepsRes.error.message}`);
  if (equipRes.error) throw new Error(`DEV equipment_items query failed: ${equipRes.error.message}`);
  if (listRes.error) throw new Error(`DEV list_items query failed: ${listRes.error.message}`);
  if (settingsRes.error) throw new Error(`DEV site_settings query failed: ${settingsRes.error.message}`);
  if (adminsRes.error) throw new Error(`DEV admins query failed: ${adminsRes.error.message}`);
  if (e2eProcRes.error) throw new Error(`DEV e2e procedures query failed: ${e2eProcRes.error.message}`);

  // 2. Max updated_at timestamps
  const [procMaxUpdatedRes, settingsMaxUpdatedRes] = await Promise.all([
    supabase.from("procedures").select("updated_at").order("updated_at", { ascending: false }).limit(1),
    supabase.from("site_settings").select("updated_at").order("updated_at", { ascending: false }).limit(1),
  ]);

  const maxProcUpdatedAt = procMaxUpdatedRes.data?.[0]?.updated_at || null;
  const maxSettingsUpdatedAt = settingsMaxUpdatedRes.data?.[0]?.updated_at || null;

  // 3. Storage objects in 'site-images'
  let storageObjectsCount = 0;
  try {
    const storageRes = await supabase
      .schema("storage")
      .from("objects")
      .select("*", { count: "exact", head: true })
      .eq("bucket_id", "site-images");
    if (!storageRes.error && storageRes.count !== null) {
      storageObjectsCount = storageRes.count;
    } else {
      // Fallback via storage API list
      const listRes = await supabase.storage.from("site-images").list("", { limit: 100 });
      storageObjectsCount = listRes.data ? listRes.data.length : 0;
    }
  } catch {
    const listRes = await supabase.storage.from("site-images").list("", { limit: 100 });
    storageObjectsCount = listRes.data ? listRes.data.length : 0;
  }

  return {
    projectRef: DEV_PROJECT_REF,
    timestamp: new Date().toISOString(),
    counts: {
      procedures: procRes.count ?? 0,
      checklist_steps: stepsRes.count ?? 0,
      equipment_items: equipRes.count ?? 0,
      list_items: listRes.count ?? 0,
      site_settings: settingsRes.count ?? 0,
      admins: adminsRes.count ?? 0,
      storage_objects: storageObjectsCount,
      e2e_procedures: e2eProcRes.count ?? 0,
    },
    maxUpdatedAt: {
      procedures: maxProcUpdatedAt,
      site_settings: maxSettingsUpdatedAt,
    },
  };
}

/**
 * Compares two DEV fingerprints and returns all detected discrepancies.
 */
export function compareDevFingerprints(
  before: DevFingerprint,
  after: DevFingerprint
): { matches: boolean; diffs: string[] } {
  const diffs: string[] = [];

  // Check counts
  const tables = [
    "procedures",
    "checklist_steps",
    "equipment_items",
    "list_items",
    "site_settings",
    "admins",
    "storage_objects",
  ] as const;

  for (const table of tables) {
    if (before.counts[table] !== after.counts[table]) {
      diffs.push(
        `Table '${table}' count changed: before=${before.counts[table]}, after=${after.counts[table]}`
      );
    }
  }

  // Check e2e- rows
  if (after.counts.e2e_procedures > 0) {
    diffs.push(
      `CRITICAL: ${after.counts.e2e_procedures} 'e2e-%' procedure(s) detected in DEV project after test run!`
    );
  }

  // Check max updated_at timestamps
  if (before.maxUpdatedAt.procedures !== after.maxUpdatedAt.procedures) {
    diffs.push(
      `procedures max(updated_at) changed: before=${before.maxUpdatedAt.procedures}, after=${after.maxUpdatedAt.procedures}`
    );
  }

  if (before.maxUpdatedAt.site_settings !== after.maxUpdatedAt.site_settings) {
    diffs.push(
      `site_settings max(updated_at) changed: before=${before.maxUpdatedAt.site_settings}, after=${after.maxUpdatedAt.site_settings}`
    );
  }

  return {
    matches: diffs.length === 0,
    diffs,
  };
}

/**
 * Asserts DEV database has not mutated. Throws immediately if any change is detected.
 */
export function assertDevUnchanged(before: DevFingerprint, after: DevFingerprint): void {
  const { matches, diffs } = compareDevFingerprints(before, after);
  if (!matches) {
    throw new Error(
      `🛑 [DEV INTEGRITY VIOLATION] DEV database '${DEV_PROJECT_REF}' was mutated during test execution!\n` +
      diffs.map((d) => `  - ${d}`).join("\n")
    );
  }
}
