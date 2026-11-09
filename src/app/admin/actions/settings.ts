"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/admin";
import { isDemoMode } from "@/lib/data";
import { siteSettingsSchema, SiteSettingsInput } from "@/lib/validation/procedure";
import { updateDemoSiteSettings, DEMO_SITE_SETTINGS } from "@/data/demo-data";

export interface SettingsActionResponse {
  success?: boolean;
  error?: string;
}

function revalidateAllPublicRoutes() {
  try {
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/procedures");
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
  } catch {}
}

export async function updateSiteSettings(
  data: SiteSettingsInput
): Promise<SettingsActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  const parsed = siteSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  if (isDemoMode()) {
    updateDemoSiteSettings(parsed.data);
    revalidateAllPublicRoutes();
    return { success: true };
  }

  try {
    const supabase = auth.supabase;
    const { error } = await supabase
      .from("site_settings")
      .update(parsed.data)
      .eq("id", 1);

    if (error) {
      return { error: error.message };
    }

    revalidateAllPublicRoutes();
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update settings." };
  }
}

export async function removeLogoAction(): Promise<SettingsActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  if (isDemoMode()) {
    updateDemoSiteSettings({ logo_path: null });
    revalidateAllPublicRoutes();
    return { success: true };
  }

  try {
    const supabase = auth.supabase;
    const { data: current } = await supabase
      .from("site_settings")
      .select("logo_path")
      .eq("id", 1)
      .single();

    if (current?.logo_path) {
      try {
        await supabase.storage.from("site-images").remove([current.logo_path]);
      } catch {}
    }

    const { error } = await supabase
      .from("site_settings")
      .update({ logo_path: null })
      .eq("id", 1);

    if (error) {
      return { error: error.message };
    }

    revalidateAllPublicRoutes();
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to remove logo." };
  }
}
