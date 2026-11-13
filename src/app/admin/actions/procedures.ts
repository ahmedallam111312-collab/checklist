"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { verifyAdmin } from "@/lib/auth/admin";
import { isDemoMode } from "@/lib/data";
import {
  procedureDetailsSchema,
  procedureOverviewSchema,
  reorderBatchSchema,
  ProcedureDetailsInput,
  ProcedureOverviewInput,
} from "@/lib/validation/procedure";
import { AR_STRINGS } from "@/messages/ar";
import {
  addDemoProcedure,
  updateDemoProcedureDetails,
  updateDemoProcedureOverview,
  deleteDemoProcedure,
  reorderDemoProcedures,
  DEMO_PROCEDURES,
} from "@/data/demo-data";
import { Procedure } from "@/types/database";
import { deleteMuxAsset, isMuxConfigured } from "@/lib/mux/client";
import { withIdempotency } from "@/lib/idempotency";

export interface ActionResponse {
  success?: boolean;
  error?: string;
  procedureId?: string;
  slug?: string;
}

/**
 * Revalidates public routes affected by procedure modifications.
 */
function revalidateAffectedRoutes(slug?: string) {
  try {
    if (slug) {
      revalidatePath(`/procedures/${slug}`);
      revalidateTag(`procedure-${slug}`);
    }
    revalidatePath("/procedures");
    revalidatePath("/admin");
    revalidatePath("/home");
    revalidatePath("/");
    revalidateTag("procedures");
    revalidateTag("site-settings");
  } catch (err) {
    // Ignore in non-production test harnesses
  }
}

/**
 * Creates a new procedure (Details tab).
 */
export async function createProcedure(
  data: ProcedureDetailsInput,
  idempotencyKey?: string
): Promise<ActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  return withIdempotency(
    idempotencyKey,
    auth.user?.id || "admin",
    "create_procedure",
    async () => {
      const parsed = procedureDetailsSchema.safeParse(data);
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || "Validation failed" };
      }

      const { title, slug, short_description, cover_path, cover_alt, blur_data_url, published } =
        parsed.data;

      // Demo mode
      if (isDemoMode()) {
        const existing = DEMO_PROCEDURES.find((p) => p.slug === slug);
        if (existing) {
          return { error: "Procedure slug already exists. Please choose a unique slug." };
        }

        const maxSort = DEMO_PROCEDURES.reduce(
          (max, p) => (p.sort_order > max ? p.sort_order : max),
          0
        );

        const newProc: Procedure = {
          id: `proc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          slug,
          title,
          short_description,
          definition: "",
          cover_path: cover_path || null,
          cover_alt,
          blur_data_url: blur_data_url || null,
          sort_order: maxSort + 10,
          published,
          video_status: "none",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          list_items: [],
          equipment_items: [],
          checklist_steps: [],
        };

        addDemoProcedure(newProc);
        revalidateAffectedRoutes(slug);
        return { success: true, procedureId: newProc.id, slug };
      }

      // Supabase with RLS
      try {
        const supabase = auth.supabase;

        // Check slug uniqueness
        const { data: existing } = await supabase
          .from("procedures")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existing) {
          return { error: "Procedure slug already exists. Please choose a unique slug." };
        }

        // Determine max sort order
        const { data: maxRow } = await supabase
          .from("procedures")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextSort = (maxRow?.sort_order ?? 0) + 10;

        const { data: newRow, error: insertError } = await supabase
          .from("procedures")
          .insert({
            title,
            slug,
            short_description,
            cover_path: cover_path || null,
            cover_alt,
            blur_data_url: blur_data_url || null,
            published,
            sort_order: nextSort,
          })
          .select("id, slug")
          .single();

        if (insertError || !newRow) {
          return { error: insertError?.message || "Failed to create procedure." };
        }

        revalidateAffectedRoutes(newRow.slug);
        return { success: true, procedureId: newRow.id, slug: newRow.slug };
      } catch (err: any) {
        return { error: err.message || "Failed to create procedure." };
      }
    }
  );
}

/**
 * Updates procedure details (Details tab).
 */
export async function updateProcedureDetails(
  id: string,
  data: ProcedureDetailsInput
): Promise<ActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  const parsed = procedureDetailsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const { title, slug, short_description, cover_path, cover_alt, blur_data_url, published } =
    parsed.data;



  // Demo mode
  if (isDemoMode()) {
    const duplicate = DEMO_PROCEDURES.find(
      (p) => p.slug === slug && p.id !== id
    );
    if (duplicate) {
      return { error: "Procedure slug is already taken by another procedure." };
    }

    const success = updateDemoProcedureDetails(id, {
      title,
      slug,
      short_description,
      cover_path: cover_path || null,
      cover_alt,
      blur_data_url: blur_data_url || null,
      published,
    });

    if (!success) {
      return { error: "Procedure not found." };
    }

    revalidateAffectedRoutes(slug);
    return { success: true, procedureId: id, slug };
  }

  // Supabase with RLS
  try {
    const supabase = auth.supabase;

    // Check slug uniqueness
    const { data: duplicate } = await supabase
      .from("procedures")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      return { error: "Procedure slug is already taken by another procedure." };
    }

    const { error: updateError } = await supabase
      .from("procedures")
      .update({
        title,
        slug,
        short_description,
        cover_path: cover_path || null,
        cover_alt,
        blur_data_url: blur_data_url || null,
        published,
      })
      .eq("id", id);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidateAffectedRoutes(slug);
    return { success: true, procedureId: id, slug };
  } catch (err: any) {
    return { error: err.message || "Failed to update procedure." };
  }
}

/**
 * Updates procedure overview (Definition, Indications, Contraindications, Common Mistakes).
 */
export async function updateProcedureOverview(
  id: string,
  data: ProcedureOverviewInput
): Promise<ActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  const parsed = procedureOverviewSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const { definition, indications, contraindications, common_mistakes } =
    parsed.data;

  // Demo mode
  if (isDemoMode()) {
    const success = updateDemoProcedureOverview(
      id,
      definition,
      indications,
      contraindications,
      common_mistakes
    );
    if (!success) {
      return { error: "Procedure not found." };
    }
    const proc = DEMO_PROCEDURES.find((p) => p.id === id);
    revalidateAffectedRoutes(proc?.slug);
    return { success: true };
  }

  // Supabase with RLS
  try {
    const supabase = auth.supabase;

    // 1. Update definition in procedures table
    const { error: defError } = await supabase
      .from("procedures")
      .update({ definition })
      .eq("id", id);

    if (defError) {
      return { error: defError.message };
    }

    // 2. Delete existing list_items for this procedure
    await supabase.from("list_items").delete().eq("procedure_id", id);

    // 3. Insert new ordered items
    const rowsToInsert = [
      ...indications.map((text, idx) => ({
        procedure_id: id,
        kind: "indication" as const,
        text,
        sort_order: (idx + 1) * 10,
      })),
      ...contraindications.map((text, idx) => ({
        procedure_id: id,
        kind: "contraindication" as const,
        text,
        sort_order: (idx + 1) * 10,
      })),
      ...common_mistakes.map((text, idx) => ({
        procedure_id: id,
        kind: "common_mistake" as const,
        text,
        sort_order: (idx + 1) * 10,
      })),
    ];

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("list_items")
        .insert(rowsToInsert);

      if (insertError) {
        return { error: insertError.message };
      }
    }

    const { data: proc } = await supabase
      .from("procedures")
      .select("slug")
      .eq("id", id)
      .single();

    revalidateAffectedRoutes(proc?.slug);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update procedure overview." };
  }
}

/**
 * Reorders procedures in a single batch.
 */
export async function reorderProceduresBatch(
  items: Array<{ id: string; sort_order: number }>
): Promise<ActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  const parsed = reorderBatchSchema.safeParse({ items });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  if (isDemoMode()) {
    reorderDemoProcedures(parsed.data.items);
    revalidateAffectedRoutes();
    return { success: true };
  }

  try {
    const supabase = auth.supabase;

    // Execute updates in batch
    for (const item of parsed.data.items) {
      const { error } = await supabase
        .from("procedures")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);

      if (error) {
        return { error: error.message };
      }
    }

    revalidateAffectedRoutes();
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to reorder procedures." };
  }
}

/**
 * Deletes a procedure after confirming the exact title match.
 * Cleans up cover images and cascades DB children.
 */
export async function deleteProcedure(
  id: string,
  confirmedTitle: string
): Promise<ActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  if (isDemoMode()) {
    const proc = DEMO_PROCEDURES.find((p) => p.id === id);
    if (!proc) {
      return { error: "Procedure not found." };
    }
    if (proc.title.trim().toLowerCase() !== confirmedTitle.trim().toLowerCase()) {
      return { error: "Confirmed title does not match the procedure title." };
    }

    // Delete associated Mux video asset if present. Failures are reported to the admin, not swallowed.
    if (proc.mux_asset_id && !isDemoMode() && isMuxConfigured()) {
      try {
        await deleteMuxAsset(proc.mux_asset_id);
      } catch (muxErr: any) {
        return { error: `فشل حذف أصل الفيديو من Mux: ${muxErr.message}` };
      }
    }

    const oldSlug = proc.slug;
    deleteDemoProcedure(id);
    revalidateAffectedRoutes(oldSlug);
    return { success: true };
  }

  try {
    const supabase = auth.supabase;

    const { data: proc, error: fetchError } = await supabase
      .from("procedures")
      .select("id, title, slug, cover_path, mux_asset_id")
      .eq("id", id)
      .single();

    if (fetchError || !proc) {
      return { error: "Procedure not found." };
    }

    if (proc.title.trim().toLowerCase() !== confirmedTitle.trim().toLowerCase()) {
      return { error: "Confirmed title does not match the procedure title." };
    }

    // Clean up stored images (cover and equipment photos)
    const storageFilesToDelete: string[] = [];
    if (proc.cover_path) {
      storageFilesToDelete.push(proc.cover_path);
    }

    // Fetch equipment photos for this procedure
    const { data: eqPhotos } = await supabase
      .from("equipment_items")
      .select("image_path")
      .eq("procedure_id", id);

    if (eqPhotos && eqPhotos.length > 0) {
      for (const eq of eqPhotos) {
        if (eq.image_path && !eq.image_path.startsWith("demo-")) {
          storageFilesToDelete.push(eq.image_path);
        }
      }
    }

    if (storageFilesToDelete.length > 0) {
      try {
        await supabase.storage.from("site-images").remove(storageFilesToDelete);
      } catch {
        // Continue even if storage delete encounters minor issue
      }
    }

    // Delete associated Mux video asset if present. Failures are reported to the admin, not swallowed.
    if (proc.mux_asset_id && !isDemoMode() && isMuxConfigured()) {
      try {
        await deleteMuxAsset(proc.mux_asset_id);
      } catch (muxErr: any) {
        return { error: `فشل حذف أصل الفيديو من Mux: ${muxErr.message}` };
      }
    }

    const { error: deleteError } = await supabase
      .from("procedures")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    revalidateAffectedRoutes(proc.slug);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete procedure." };
  }
}
