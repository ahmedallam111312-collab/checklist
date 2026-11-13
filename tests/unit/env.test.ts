import { test, describe } from "node:test";
import assert from "node:assert";
import { validateEnv, getSiteUrl } from "@/lib/env";

describe("Environment Variables Validator (src/lib/env.ts)", () => {
  const originalEnv = { ...process.env };

  function restoreEnv() {
    process.env = { ...originalEnv };
  }

  test("1. passes validation when all required variables are set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://critical-ease.example.com";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
    process.env.SUPABASE_SECRET_KEY = "mock-secret-key";
    process.env.CRON_SECRET = "mock-cron-secret";

    const res = validateEnv(true);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.errors.length, 0);

    restoreEnv();
  });

  test("2. throws fatal error in production when required variable is missing", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
    process.env.SUPABASE_SECRET_KEY = "mock-secret-key";
    process.env.CRON_SECRET = "mock-cron-secret";

    assert.throws(
      () => validateEnv(true),
      (err: Error) => {
        assert.ok(err.message.includes("NEXT_PUBLIC_SITE_URL"));
        // Guarantee no secret value is leaked
        assert.ok(!err.message.includes("mock-secret-key"));
        return true;
      }
    );

    restoreEnv();
  });

  test("3. throws fatal error in production when NEXT_PUBLIC_SITE_URL is localhost", () => {
    process.env.VERCEL = "1";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
    process.env.SUPABASE_SECRET_KEY = "mock-secret-key";
    process.env.CRON_SECRET = "mock-cron-secret";

    assert.throws(
      () => validateEnv(true),
      (err: Error) => {
        assert.ok(err.message.includes("localhost"));
        assert.ok(err.message.includes("NEXT_PUBLIC_SITE_URL"));
        return true;
      }
    );

    restoreEnv();
  });

  test("4. getSiteUrl provides fallback in development and fails loudly in production", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    delete process.env.VERCEL;
    assert.strictEqual(getSiteUrl(), "http://localhost:3000");

    process.env.VERCEL = "1";
    assert.throws(() => getSiteUrl(), /NEXT_PUBLIC_SITE_URL/);

    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    assert.throws(() => getSiteUrl(), /localhost/);

    process.env.NEXT_PUBLIC_SITE_URL = "https://critical-ease.example.com";
    assert.strictEqual(getSiteUrl(), "https://critical-ease.example.com");

    restoreEnv();
  });
});
