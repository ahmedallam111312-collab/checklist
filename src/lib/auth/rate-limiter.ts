import { createClient } from "@supabase/supabase-js";

/**
 * Shared serverless rate limiter for login authentication.
 * Limits brute-force login attempts per IP / identifier.
 * Window: 15 minutes (900 seconds). Max failed attempts: 5.
 * Uses Supabase 'login_attempts' table when available (migration 005),
 * with immediate zero-latency in-memory fallback.
 */

interface RateLimitRecord {
  failures: number;
  firstFailureTime: number;
  blockedUntil: number;
}

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const memoryStore = new Map<string, RateLimitRecord>();

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function checkLoginRateLimit(identifier: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}> {
  const now = Date.now();

  // 1. Try checking persistent database record (005 migration)
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("login_attempts")
        .select("failures, first_failure_at, blocked_until")
        .eq("identifier", identifier)
        .maybeSingle();

      if (!error && data) {
        if (data.blocked_until && new Date(data.blocked_until).getTime() > now) {
          const retryAfterSeconds = Math.ceil(
            (new Date(data.blocked_until).getTime() - now) / 1000
          );
          return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
        }

        // If outside window, record is considered expired
        const firstTime = new Date(data.first_failure_at).getTime();
        if (now - firstTime > WINDOW_MS) {
          return { allowed: true, remainingAttempts: MAX_FAILURES };
        }

        const remaining = Math.max(0, MAX_FAILURES - (data.failures || 0));
        return { allowed: (data.failures || 0) < MAX_FAILURES, remainingAttempts: remaining };
      }
    } catch {
      // Fall through to memory store if table not applied
    }
  }

  // 2. Fallback to in-memory tracking
  const record = memoryStore.get(identifier);
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILURES };
  }

  if (record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  if (now - record.firstFailureTime > WINDOW_MS) {
    memoryStore.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_FAILURES };
  }

  const remainingAttempts = Math.max(0, MAX_FAILURES - record.failures);
  return {
    allowed: record.failures < MAX_FAILURES,
    remainingAttempts,
  };
}

export async function recordLoginFailure(identifier: string): Promise<{
  blocked: boolean;
  remainingAttempts: number;
}> {
  const now = Date.now();

  // 1. Update in-memory store
  let memRecord = memoryStore.get(identifier);
  if (!memRecord || now - memRecord.firstFailureTime > WINDOW_MS) {
    memRecord = { failures: 1, firstFailureTime: now, blockedUntil: 0 };
  } else {
    memRecord.failures += 1;
  }

  // 2. Sync & persist to Supabase if table exists (prevents multi-instance counter reset)
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data: existing, error: readErr } = await supabase
        .from("login_attempts")
        .select("failures, first_failure_at, blocked_until")
        .eq("identifier", identifier)
        .maybeSingle();

      if (!readErr) {
        let nextFailures = memRecord.failures;
        let firstFailureTime = memRecord.firstFailureTime;

        if (existing) {
          const existingFirst = new Date(existing.first_failure_at).getTime();
          if (now - existingFirst <= WINDOW_MS) {
            nextFailures = Math.max(memRecord.failures, (existing.failures || 0) + 1);
            firstFailureTime = existingFirst;
          } else {
            nextFailures = 1;
            firstFailureTime = now;
          }
        }

        const blockedUntilMs =
          nextFailures >= MAX_FAILURES
            ? Math.max(
                existing?.blocked_until ? new Date(existing.blocked_until).getTime() : 0,
                now + BLOCK_DURATION_MS
              )
            : 0;

        memRecord = {
          failures: nextFailures,
          firstFailureTime,
          blockedUntil: blockedUntilMs,
        };

        const { error: upsertError } = await supabase.from("login_attempts").upsert(
          {
            identifier,
            failures: memRecord.failures,
            first_failure_at: new Date(memRecord.firstFailureTime).toISOString(),
            blocked_until: memRecord.blockedUntil
              ? new Date(memRecord.blockedUntil).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "identifier" }
        );
        if (upsertError) {
          console.error("[rate-limiter] login_attempts upsert error:", upsertError.message);
        }
      }
    } catch {
      // Graceful fallback to in-memory record (fails open across separate instances on DB error)
    }
  }

  if (memRecord.failures >= MAX_FAILURES && !memRecord.blockedUntil) {
    memRecord.blockedUntil = now + BLOCK_DURATION_MS;
  }
  memoryStore.set(identifier, memRecord);

  return {
    blocked: memRecord.failures >= MAX_FAILURES,
    remainingAttempts: Math.max(0, MAX_FAILURES - memRecord.failures),
  };
}

export async function recordLoginSuccess(identifier: string): Promise<void> {
  memoryStore.delete(identifier);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from("login_attempts").delete().eq("identifier", identifier);
    } catch {}
  }
}

export function resetRateLimits(): void {
  memoryStore.clear();
}
