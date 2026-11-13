import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEV_PROJECT_REF = "smfsmixdymphtgfalupl";
const ROOT = process.cwd();
const ENV_TEST_PATH = path.join(ROOT, ".env.test");
const ENV_LOCAL_PATH = path.join(ROOT, ".env.local");
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");

function parseEnvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return out;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function hasPsql(): boolean {
  const res = spawnSync("psql", ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return res.status === 0;
}

async function applyWithPg(dbUrl: string, files: string[]): Promise<boolean> {
  let pgMod: unknown;
  try {
    // Dynamic import avoids requiring pg as a runtime dependency when psql is available
    pgMod = await import("pg" as string);
  } catch {
    return false;
  }

  const ClientCtor = (pgMod as { Client?: new (opts: { connectionString: string }) => {
    connect: () => Promise<void>;
    query: (sql: string) => Promise<unknown>;
    end: () => Promise<void>;
  } }).Client;
  if (!ClientCtor) return false;

  const client = new ClientCtor({ connectionString: dbUrl });
  await client.connect();
  try {
    for (const file of files) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, "utf8");
      console.log(`[apply-migrations] Applying ${file} via pg...`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Migration ${file} failed: ${msg}`);
      }
    }
  } finally {
    await client.end().catch(() => {});
  }
  return true;
}

function applyWithPsql(dbUrl: string, files: string[]): void {
  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    console.log(`[apply-migrations] Applying ${file} via psql...`);
    const res = spawnSync(
      "psql",
      ["--no-psqlrc", "-v", "ON_ERROR_STOP=1", "--single-transaction", "-f", fullPath, dbUrl],
      {
        encoding: "utf8",
        stdio: ["ignore", "inherit", "pipe"],
        env: { ...process.env, PGCONNECT_TIMEOUT: "10" },
      }
    );
    if (res.status !== 0) {
      // Redact any connection URL from stderr before printing
      const safeErr = (res.stderr || `exit code ${res.status ?? 1}`).replace(
        /postgres(?:ql)?:\/\/\S+/gi,
        "[REDACTED_DB_URL]"
      );
      throw new Error(`Migration ${file} failed: ${safeErr}`);
    }
  }
}

async function main(): Promise<void> {
  if (!fs.existsSync(ENV_TEST_PATH)) {
    console.error(
      "[apply-migrations] Refusing to run: .env.test does not exist. Create .env.test pointing strictly to a scratch Postgres or Supabase TEST project (never DEV)."
    );
    process.exit(1);
  }

  const testEnv = parseEnvFile(ENV_TEST_PATH);
  const localEnv = parseEnvFile(ENV_LOCAL_PATH);

  const dbUrl =
    testEnv.TEST_DATABASE_URL ||
    testEnv.TEST_SUPABASE_DB_URL ||
    testEnv.DATABASE_URL ||
    "";

  const testSupabaseUrl = testEnv.NEXT_PUBLIC_SUPABASE_URL || "";
  const devSupabaseUrl = localEnv.NEXT_PUBLIC_SUPABASE_URL || "";
  const devDbUrl = localEnv.DATABASE_URL || "";

  if (!dbUrl) {
    console.error(
      "[apply-migrations] Missing TEST_DATABASE_URL, TEST_SUPABASE_DB_URL, or DATABASE_URL in .env.test."
    );
    process.exit(1);
  }

  if (
    dbUrl.includes(DEV_PROJECT_REF) ||
    testSupabaseUrl.includes(DEV_PROJECT_REF) ||
    (devSupabaseUrl && testSupabaseUrl && testSupabaseUrl === devSupabaseUrl) ||
    (devDbUrl && dbUrl === devDbUrl)
  ) {
    console.error(
      "[apply-migrations] SAFETY ABORT: .env.test points to the DEV project. Refusing to apply migrations to DEV."
    );
    process.exit(1);
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`[apply-migrations] Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.+\.sql$/i.test(f))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.error("[apply-migrations] No numbered migration files found.");
    process.exit(1);
  }

  console.log(`[apply-migrations] Found ${files.length} migrations: ${files.join(", ")}`);

  if (hasPsql()) {
    applyWithPsql(dbUrl, files);
    console.log(`[apply-migrations] Successfully applied ${files.length} migrations.`);
    return;
  }

  const ranPg = await applyWithPg(dbUrl, files);
  if (ranPg) {
    console.log(`[apply-migrations] Successfully applied ${files.length} migrations.`);
    return;
  }

  console.error(
    "[apply-migrations] Neither 'psql' CLI nor npm package 'pg' is available. Install PostgreSQL client tools (psql) or install 'pg' before applying migrations."
  );
  process.exit(1);
}

main().catch((err) => {
  const safeMsg = (err instanceof Error ? err.message : String(err)).replace(
    /postgres(?:ql)?:\/\/\S+/gi,
    "[REDACTED_DB_URL]"
  );
  console.error(`[apply-migrations] ERROR: ${safeMsg}`);
  process.exit(1);
});
