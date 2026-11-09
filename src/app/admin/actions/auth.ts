"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data";
import { loginSchema } from "@/lib/validation/procedure";
import { AR_STRINGS } from "@/messages/ar";

export async function loginAdmin(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: AR_STRINGS.loginGenericError };
  }

  // Demo mode authentication
  if (isDemoMode()) {
    const validEmail = process.env.E2E_ADMIN_EMAIL;
    const validPassword = process.env.E2E_ADMIN_PASSWORD;

    if (!validEmail || !validPassword) {
      return { error: "E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD missing in environment." };
    }

    if (parsed.data.email === validEmail && parsed.data.password === validPassword) {
      const cookieStore = await cookies();
      cookieStore.set("profnurse_demo_admin", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return { success: true };
    }
    return { error: AR_STRINGS.loginGenericError };
  }

  // Real Supabase authentication
  try {
    const supabase = await createClient();
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

    if (signInError || !signInData.user) {
      return { error: AR_STRINGS.loginGenericError };
    }

    // Verify admin RPC
    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
    if (rpcError || !isAdmin) {
      await supabase.auth.signOut();
      return { error: AR_STRINGS.loginGenericError };
    }

    return { success: true };
  } catch {
    return { error: AR_STRINGS.loginGenericError };
  }
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();

  if (isDemoMode()) {
    cookieStore.delete("profnurse_demo_admin");
    redirect("/admin/login");
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {}

  redirect("/admin/login");
}
