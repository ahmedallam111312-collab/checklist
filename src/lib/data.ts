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

function isLegacyBrandString(value: string | null | undefined): boolean {
  return !value || /prof\s*nurse/i.test(value.trim());
}

function hasArabic(str: string | null | undefined): boolean {
  if (!str) return false;
  return /[\u0600-\u06FF]/.test(str);
}

function normalizeLegacySettings(raw: SiteSettings): SiteSettings {
  return {
    ...raw,
    site_name: isLegacyBrandString(raw.site_name) || hasArabic(raw.site_name)
      ? BRAND.name
      : raw.site_name,
    tagline:
      !raw.tagline || raw.tagline === "Learn. Practice. Perform." || hasArabic(raw.tagline)
        ? BRAND.tagline
        : raw.tagline,
    splash_cta:
      !raw.splash_cta || hasArabic(raw.splash_cta)
        ? BRAND.splashCta
        : raw.splash_cta,
    hero_eyebrow:
      !raw.hero_eyebrow || hasArabic(raw.hero_eyebrow)
        ? BRAND.heroEyebrow
        : raw.hero_eyebrow,
    hero_title:
      isLegacyBrandString(raw.hero_title) || hasArabic(raw.hero_title)
        ? BRAND.heroTitle
        : raw.hero_title,
    hero_description:
      !raw.hero_description || hasArabic(raw.hero_description)
        ? BRAND.heroDescription
        : raw.hero_description,
    hero_cta:
      !raw.hero_cta || hasArabic(raw.hero_cta)
        ? BRAND.heroCta
        : raw.hero_cta,
    footer_text:
      !raw.footer_text || hasArabic(raw.footer_text)
        ? BRAND.footerText
        : raw.footer_text,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isDemoMode()) {
    const { DEMO_SITE_SETTINGS } = await import("@/data/demo-data");
    return DEMO_SITE_SETTINGS;
  }

  try {
    const { createPublicClient } = await import("@/lib/supabase/server");
    const supabase = createPublicClient();
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

    return normalizeLegacySettings(data as SiteSettings);
  } catch {
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
}

export async function getPublishedProceduresCountSafe(): Promise<number | null> {
  if (isDemoMode()) {
    const { DEMO_PROCEDURES } = await import("@/data/demo-data");
    return DEMO_PROCEDURES.filter((p) => p.published).length;
  }

  try {
    const { createPublicClient } = await import("@/lib/supabase/server");
    const supabase = createPublicClient();
    const { count, error } = await supabase
      .from("procedures")
      .select("id", { count: "exact", head: true })
      .eq("published", true);

    if (error || typeof count !== "number") {
      return null;
    }
    return count;
  } catch {
    return null;
  }
}

export async function getPublishedProcedures(): Promise<Procedure[]> {
  if (isDemoMode()) {
    const { DEMO_PROCEDURES } = await import("@/data/demo-data");
    return DEMO_PROCEDURES.filter((p) => p.published).sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  const { createPublicClient } = await import("@/lib/supabase/server");
  const supabase = createPublicClient();
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

  const { createPublicClient } = await import("@/lib/supabase/server");
  const supabase = createPublicClient();

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
