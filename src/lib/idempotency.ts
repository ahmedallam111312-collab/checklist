import { createClient } from "@/lib/supabase/server";

interface IdempotencyCacheEntry {
  response: unknown;
  expiresAt: number;
}

// In-memory fallback map if DB migration 006 has not yet been applied
const inMemoryFallback = new Map<string, IdempotencyCacheEntry>();
// In-flight deduplication map for concurrent double-clicks on the same instance
const inFlightRequests = new Map<string, Promise<unknown>>();

export async function withIdempotency<T>(
  key: string | undefined | null,
  userId: string,
  action: string,
  fn: () => Promise<T>,
  ttlSeconds = 300,
  supabaseClientOverride?: any
): Promise<T> {
  // If no idempotency key provided by client, proceed directly
  if (!key || typeof key !== "string" || key.trim() === "") {
    return fn();
  }

  const normalizedKey = key.trim();
  const lookupKey = `${userId}:${action}:${normalizedKey}`;
  const now = Date.now();

  // 0. Join any concurrent in-flight execution with the exact same intent key
  const existingFlight = inFlightRequests.get(lookupKey);
  if (existingFlight) {
    return (await existingFlight) as T;
  }

  // 1. Check in-memory cache first
  const memCached = inMemoryFallback.get(lookupKey);
  if (memCached && memCached.expiresAt > now) {
    return memCached.response as T;
  }

  // 2. Check DB + execute + persist under synchronous in-flight lock so simultaneous double-clicks run fn() once
  const getDbClient = async () => supabaseClientOverride ?? (await createClient());

  const executionPromise = (async (): Promise<T> => {
    try {
      const supabase = await getDbClient();
      const { data, error } = await supabase
        .from("idempotency_keys")
        .select("response, expires_at")
        .eq("key", normalizedKey)
        .eq("user_id", userId)
        .eq("action", action)
        .maybeSingle();

      if (!error && data) {
        const expiresAt = new Date(data.expires_at).getTime();
        if (expiresAt > Date.now()) {
          inMemoryFallback.set(lookupKey, {
            response: data.response,
            expiresAt,
          });
          return data.response as T;
        }
        // Expired entry: clean up before executing new request
        await supabase
          .from("idempotency_keys")
          .delete()
          .eq("key", normalizedKey)
          .eq("user_id", userId)
          .eq("action", action);
      }
    } catch {
      // Graceful fallback when running outside Next.js request context or before 006 migration
    }

    const result = await fn();
    const expiresAtMs = Date.now() + ttlSeconds * 1000;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    inMemoryFallback.set(lookupKey, {
      response: result,
      expiresAt: expiresAtMs,
    });

    try {
      const supabase = await getDbClient();
      const { error: insertError } = await supabase.from("idempotency_keys").insert({
        key: normalizedKey,
        user_id: userId,
        action,
        response: result as Record<string, unknown>,
        expires_at: expiresAtIso,
      });

      if (insertError) {
        // Unique conflict from another serverless worker: return the winning worker's stored result
        const { data } = await supabase
          .from("idempotency_keys")
          .select("response")
          .eq("key", normalizedKey)
          .eq("user_id", userId)
          .eq("action", action)
          .maybeSingle();

        if (data?.response) {
          inMemoryFallback.set(lookupKey, {
            response: data.response,
            expiresAt: expiresAtMs,
          });
          return data.response as T;
        }
        console.warn("[idempotency] persist failed:", insertError.code, insertError.message);
      }
    } catch {
      // Ignore DB persistence errors if table unavailable in isolated unit tests
    }

    return result;
  })();

  inFlightRequests.set(lookupKey, executionPromise);
  try {
    return await executionPromise;
  } finally {
    inFlightRequests.delete(lookupKey);
  }
}

export function clearIdempotencyMemoryCache(): void {
  inMemoryFallback.clear();
}
