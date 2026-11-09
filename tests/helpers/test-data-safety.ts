import fs from "fs";
import path from "path";

/**
 * Extracts the project reference ID from a Supabase URL.
 * e.g. "https://abcdefghijklmnopqrst.supabase.co" -> "abcdefghijklmnopqrst"
 */
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
 * Reads TEST_SUPABASE_PROJECT_REF from .env.test if present.
 */
export function getTestProjectRefFromEnvFile(): string | null {
  const envTestPath = path.join(process.cwd(), ".env.test");
  if (!fs.existsSync(envTestPath)) {
    return null;
  }

  const content = fs.readFileSync(envTestPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("TEST_SUPABASE_PROJECT_REF=")) {
      const val = trimmed.slice("TEST_SUPABASE_PROJECT_REF=".length).trim();
      return val.replace(/^["']|["']$/g, "") || null;
    }
  }
  return null;
}

/**
 * T1 Guard: Enforces test data safety.
 * Refuses to run any test unless:
 * 1. .env.test exists.
 * 2. TEST_SUPABASE_PROJECT_REF is explicitly defined in .env.test.
 * 3. NEXT_PUBLIC_SUPABASE_URL matches that exact test project ref.
 *
 * Tests must NEVER run against development or production Supabase projects.
 */
export function assertTestDataSafety(): void {
  const envTestExists = fs.existsSync(path.join(process.cwd(), ".env.test"));
  if (!envTestExists) {
    throw new Error(
      "🛑 [TEST DATA SAFETY VIOLATION] .env.test file is missing in the workspace root.\n" +
      "Tests are strictly forbidden from running against the development or production Supabase project.\n" +
      "You must create a dedicated second Supabase project for testing and configure .env.test."
    );
  }

  const testProjectRef = getTestProjectRefFromEnvFile();
  if (!testProjectRef) {
    throw new Error(
      "🛑 [TEST DATA SAFETY VIOLATION] TEST_SUPABASE_PROJECT_REF is not configured in .env.test.\n" +
      "Please set TEST_SUPABASE_PROJECT_REF=<your-test-project-ref> in .env.test."
    );
  }

  const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const currentRef = extractProjectRef(currentUrl);

  if (!currentRef || currentRef !== testProjectRef) {
    throw new Error(
      `🛑 [TEST DATA SAFETY VIOLATION] Current Supabase URL project ref ('${currentRef || "empty"}') ` +
      `does not match TEST_SUPABASE_PROJECT_REF ('${testProjectRef}') defined in .env.test.\n` +
      "Refusing to execute tests against non-test database project."
    );
  }
}
