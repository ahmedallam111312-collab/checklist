import { z } from "zod";

/**
 * Schema for client-exposed environment variables.
 * These are baked into the client bundle at build time by Next.js.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().min(1, "NEXT_PUBLIC_SITE_URL is required"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required")
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_USE_DEMO_DATA: z.enum(["true", "false"]).optional(),
});

/**
 * Schema for server-only environment variables.
 * These must never be exposed to the client bundle.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),
  CRON_SECRET: z.string().optional(),
  HEALTH_CHECK_SECRET: z.string().optional(),
  E2E_ADMIN_EMAIL: z.string().email().optional(),
  E2E_ADMIN_PASSWORD: z.string().optional(),
  MUX_TOKEN_ID: z.string().optional(),
  MUX_TOKEN_SECRET: z.string().optional(),
  MUX_SIGNING_KEY_ID: z.string().optional(),
  MUX_SIGNING_PRIVATE_KEY: z.string().optional(),
  MUX_WEBHOOK_SECRET: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates environment variables according to the active runtime environment.
 * In production:
 * - Missing required variables throw an Error with the variable NAMES ONLY (never values).
 * - NEXT_PUBLIC_SITE_URL must not be localhost or loopback in production.
 * - At least one of CRON_SECRET or HEALTH_CHECK_SECRET must be configured.
 */
export function validateEnv(isProduction = process.env.NODE_ENV === "production"): EnvValidationResult {
  // Normalize Supabase key alias
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const clientResult = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    NEXT_PUBLIC_USE_DEMO_DATA: process.env.NEXT_PUBLIC_USE_DEMO_DATA,
  });

  const serverResult = serverEnvSchema.safeParse(process.env);

  const collectedErrors: string[] = [];

  if (!clientResult.success) {
    for (const issue of clientResult.error.issues) {
      const field = issue.path.join(".");
      collectedErrors.push(`Client env validation failed for [${field}]: ${issue.message}`);
    }
  }

  if (!serverResult.success) {
    for (const issue of serverResult.error.issues) {
      const field = issue.path.join(".");
      collectedErrors.push(`Server env validation failed for [${field}]: ${issue.message}`);
    }
  }

  // Production-specific constraints (enforced on Vercel deployment or strict audit)
  const isStrictProd = isProduction && (Boolean(process.env.VERCEL) || process.env.STRICT_PROD_SITE_URL === "true");
  if (isStrictProd) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    if (
      siteUrl.includes("localhost") ||
      siteUrl.includes("127.0.0.1") ||
      siteUrl.includes("0.0.0.0")
    ) {
      collectedErrors.push(
        "Production constraint failed: NEXT_PUBLIC_SITE_URL cannot be localhost or loopback in production."
      );
    }

    if (!siteUrl.startsWith("https://")) {
      collectedErrors.push(
        "Production constraint failed: NEXT_PUBLIC_SITE_URL must start with https:// in production."
      );
    }

    if (!process.env.CRON_SECRET && !process.env.HEALTH_CHECK_SECRET) {
      collectedErrors.push(
        "Production constraint failed: Either CRON_SECRET or HEALTH_CHECK_SECRET must be set for /api/health security."
      );
    }

    if (process.env.VERCEL && process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true") {
      collectedErrors.push(
        "Production constraint failed: NEXT_PUBLIC_USE_DEMO_DATA cannot be 'true' on a deployed Vercel build."
      );
    }
  }

  if (collectedErrors.length > 0 && isProduction) {
    const formatted = collectedErrors.map((e) => `  - ${e}`).join("\n");
    throw new Error(
      `[FATAL] Production Environment Validation Failed:\n${formatted}\n(Note: Secret values are never displayed)`
    );
  }

  return {
    valid: collectedErrors.length === 0,
    errors: collectedErrors,
  };
}

/**
 * Returns validated site URL with fallback for development.
 * In production, fails loudly if missing or localhost.
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  const isVercel = Boolean(process.env.VERCEL);
  const isStrict = isVercel || process.env.STRICT_PROD_SITE_URL === "true";

  if (!url) {
    if (isStrict) {
      throw new Error(
        "[FATAL] NEXT_PUBLIC_SITE_URL is required in production and was not set."
      );
    }
    return "http://localhost:3000";
  }

  if (isStrict && (url.includes("localhost") || url.includes("127.0.0.1"))) {
    throw new Error(
      "[FATAL] NEXT_PUBLIC_SITE_URL cannot be localhost in production. Please configure your production domain."
    );
  }

  return url.replace(/\/+$/, "");
}
