import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Health check & keep-alive endpoint.
 * Protected by shared secret: Authorization: Bearer ${CRON_SECRET} or HEALTH_CHECK_SECRET header.
 * Keeps free-tier Supabase project active by executing a read query.
 * Returns only { ok, db } without versions or stack traces.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secretHeader =
    request.headers.get("health_check_secret") ||
    request.headers.get("health-check-secret") ||
    request.headers.get("x-health-check-secret");
  const queryToken = request.nextUrl.searchParams.get("token");

  const validSecrets = [
    process.env.CRON_SECRET,
    process.env.HEALTH_CHECK_SECRET,
  ].filter(Boolean) as string[];

  // 1. Authenticate request using configured secrets
  let isAuthorized = false;

  // If no secret is configured in env, refuse access to prevent unauthenticated access
  if (validSecrets.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check Bearer token in Authorization header
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim();
    if (validSecrets.includes(bearerToken)) {
      isAuthorized = true;
    }
  }

  // Check custom header
  if (!isAuthorized && secretHeader && validSecrets.includes(secretHeader.trim())) {
    isAuthorized = true;
  }

  // Check query parameter fallback
  if (!isAuthorized && queryToken && validSecrets.includes(queryToken.trim())) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Perform lightweight DB ping
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, db: false },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, anonKey);
    const { error } = await supabase
      .from("site_settings")
      .select("site_name")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, db: false },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { ok: true, db: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: false },
      { status: 500 }
    );
  }
}
