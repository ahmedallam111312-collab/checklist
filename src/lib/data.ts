import { Procedure, SiteSettings } from "@/types/database";
import { BRAND } from "@/config/brand";

export function isDemoMode(): boolean {
  if (process.env.VERCEL && process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true") {
    throw new Error(
      "SECURITY VIOLATION: NEXT_PUBLIC_USE_DEMO_DATA cannot be enabled on a deployed Vercel environment."
    );
  }
  return process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true";
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isDemoMode()) {
    const { DEMO_SITE_SETTINGS } = await import("@/data/demo-data");
    return DEMO_SITE_SETTINGS;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return {
      id: 1,
      site_name: BRAND.name,
      tagline: BRAND.tagline,
      splash_cta: BRAND.splashCta,
      hero_eyebrow: BRAND.heroEyebrow,
      hero_title: BRAND.heroTitle,
      hero_description: BRAND.heroDescription,
      hero_cta: BRAND.heroCta,
      footer_text: BRAND.footerText,
      logo_path: null,
      updated_at: new Date().toISOString(),
    };
  }

  return data as SiteSettings;
}

export async function getPublishedProcedures(): Promise<Procedure[]> {
  if (isDemoMode()) {
    const { DEMO_PROCEDURES } = await import("@/data/demo-data");
    return DEMO_PROCEDURES.filter((p) => p.published).sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load procedures from Supabase: ${error.message}`);
  }

  return (data || []) as Procedure[];
}

export async function getProcedureBySlug(
  slug: string
): Promise<Procedure | null> {
  if (isDemoMode()) {
    const { DEMO_PROCEDURES } = await import("@/data/demo-data");
    const proc = DEMO_PROCEDURES.find((p) => p.slug === slug && p.published);
    return proc || null;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: proc, error: procError } = await supabase
    .from("procedures")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (procError || !proc) {
    return null;
  }

  // Fetch related list items, equipment, checklist steps
  const [listRes, eqRes, stepsRes] = await Promise.all([
    supabase
      .from("list_items")
      .select("*")
      .eq("procedure_id", proc.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("equipment_items")
      .select("*")
      .eq("procedure_id", proc.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("checklist_steps")
      .select("*")
      .eq("procedure_id", proc.id)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    ...proc,
    list_items: listRes.data || [],
    equipment_items: eqRes.data || [],
    checklist_steps: stepsRes.data || [],
  } as Procedure;
}
