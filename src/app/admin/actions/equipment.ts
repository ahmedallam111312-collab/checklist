"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/admin";
import { isDemoMode } from "@/lib/data";
import { DEMO_PROCEDURES } from "@/data/demo-data";
import {
  equipmentBatchSchema,
  EquipmentItemInput,
} from "@/lib/validation/procedure";
import { EquipmentItem } from "@/types/database";

export interface EquipmentActionResponse {
  success?: boolean;
  error?: string;
  items?: EquipmentItem[];
}

function revalidateAffectedRoutes(slug?: string) {
  try {
    revalidatePath("/procedures");
    revalidatePath("/home");
    revalidatePath("/admin");
    if (slug) {
      revalidatePath(`/procedures/${slug}`);
      revalidatePath(`/admin/preview/${slug}`);
    }
  } catch {}
}

/**
 * Updates all equipment items for a procedure in batch.
 *
 * Rules:
 * - Admin session verified via verifyAdmin()
 * - Preserves existing item IDs
 * - Upsert & insert first, then delete removed items (write order protects against data loss)
 * - Deletes removed items' photos from Supabase storage using the authenticated admin session
 * - Revalidates affected public routes
 */
export async function updateEquipmentBatch(
  procedureId: string,
  rawItems: EquipmentItemInput[]
): Promise<EquipmentActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  const parsed = equipmentBatchSchema.safeParse({
    procedureId,
    items: rawItems,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const { items } = parsed.data;

  // Demo mode handler
  if (isDemoMode()) {
    const proc = DEMO_PROCEDURES.find((p) => p.id === procedureId);
    if (!proc) {
      return { error: "Procedure not found in demo data." };
    }

    const updatedItems: EquipmentItem[] = items.map((item, index) => ({
      id: item.id || `demo-eq-${Date.now()}-${index}`,
      procedure_id: procedureId,
      name: item.name,
      photo_path: item.photo_path || item.image_path || null,
      image_path: item.photo_path || item.image_path || null,
      sort_order: (index + 1) * 10,
    }));

    proc.equipment_items = updatedItems;
    revalidateAffectedRoutes(proc.slug);
    return { success: true, items: updatedItems };
  }

  // Real Supabase mode
  try {
    const supabase = auth.supabase;

    // Fetch procedure to check existence and slug for revalidation
    const { data: proc, error: procError } = await supabase
      .from("procedures")
      .select("id, slug")
      .eq("id", procedureId)
      .single();

    if (procError || !proc) {
      return { error: "Procedure not found." };
    }

    // Fetch existing equipment items to detect deletions & photo cleanup
    const { data: existingItems, error: fetchError } = await supabase
      .from("equipment_items")
      .select("id, image_path")
      .eq("procedure_id", procedureId);

    if (fetchError) {
      return { error: `Failed to fetch existing equipment: ${fetchError.message}` };
    }

    const incomingIds = new Set(items.map((i) => i.id).filter(Boolean));
    const toDelete = (existingItems || []).filter((ei: any) => !incomingIds.has(ei.id));

    // 1. Prepare items with 10-interval sort_orders
    const itemsToUpsert = items.map((item, index) => {
      const photo = item.photo_path || item.image_path || null;
      const row: any = {
        procedure_id: procedureId,
        name: item.name,
        image_path: photo,
        sort_order: (index + 1) * 10,
      };
      if (item.id) {
        row.id = item.id;
      }
      return row;
    });

    // 2. Upsert/insert first (protects data against mid-operation failure)
    let savedItems: EquipmentItem[] = [];
    if (itemsToUpsert.length > 0) {
      const { data: upsertData, error: upsertError } = await supabase
        .from("equipment_items")
        .upsert(itemsToUpsert, { onConflict: "id" })
        .select();

      if (upsertError) {
        return { error: `Failed to save equipment: ${upsertError.message}` };
      }
      savedItems = (upsertData || []).map((row: any) => ({
        ...row,
        photo_path: row.image_path,
      })).sort((a: any, b: any) => a.sort_order - b.sort_order);
    }

    // 3. Delete removed items from database
    if (toDelete.length > 0) {
      const deleteIds = toDelete.map((i: any) => i.id);
      const { error: deleteError } = await supabase
        .from("equipment_items")
        .delete()
        .in("id", deleteIds);

      if (deleteError) {
        console.error("Warning: failed to delete removed equipment items:", deleteError.message);
      }

      // 4. Delete orphan photos from storage
      const photosToDelete = toDelete
        .map((i: any) => i.image_path)
        .filter((p: any): p is string => Boolean(p && !p.startsWith("demo-")));

      if (photosToDelete.length > 0) {
        try {
          await supabase.storage.from("site-images").remove(photosToDelete);
        } catch (e: any) {
          console.error("Warning: failed to remove orphan photos from storage:", e.message);
        }
      }
    }

    revalidateAffectedRoutes(proc.slug);
    return { success: true, items: savedItems };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred while saving equipment." };
  }
}
