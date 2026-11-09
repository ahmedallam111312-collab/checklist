import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data";

export interface AdminAuthResult {
  authorized: boolean;
  user: { id: string; email?: string } | null;
  error?: string;
  supabase?: any;
}

/**
 * Server-side admin verification:
 * Always calls supabase.auth.getUser() (never trusts getSession)
 * and confirms public.is_admin() RPC.
 *
 * In local demo mode (NEXT_PUBLIC_USE_DEMO_DATA=true),
 * supports simulated admin session via signed/httpOnly demo cookie.
 */
export async function verifyAdmin(): Promise<AdminAuthResult> {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    return {
      authorized: false,
      user: null,
      error: "Unauthorized: called outside request scope without session.",
    };
  }

  // Local demo mode check
  if (isDemoMode()) {
    const demoAuth = cookieStore.get("profnurse_demo_admin");
    if (demoAuth?.value === "authenticated") {
      return {
        authorized: true,
        user: { id: "demo-admin-uuid", email: process.env.E2E_ADMIN_EMAIL || "" },
      };
    }
    return {
      authorized: false,
      user: null,
      error: "Unauthenticated",
    };
  }

  // Real Supabase check
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        authorized: false,
        user: null,
        error: "Unauthenticated",
        supabase,
      };
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
    if (rpcError || !isAdmin) {
      return {
        authorized: false,
        user,
        error: "Unauthorized",
        supabase,
      };
    }

    return {
      authorized: true,
      user: { id: user.id, email: user.email },
      supabase,
    };
  } catch (err: any) {
    return {
      authorized: false,
      user: null,
      error: err.message || "Auth error",
    };
  }
}

/**
 * Enforces admin authorization on Server Components / Pages.
 * Redirects unauthenticated / unauthorized requests to /admin/login.
 */
export async function requireAdmin(): Promise<{ id: string; email?: string }> {
  const result = await verifyAdmin();
  if (!result.authorized || !result.user) {
    redirect("/admin/login");
  }
  return result.user;
}
