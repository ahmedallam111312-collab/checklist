"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/admin";
import { isDemoMode } from "@/lib/data";
import { DEMO_PROCEDURES } from "@/data/demo-data";
import {
  checklistBatchSchema,
  ChecklistStepInput,
} from "@/lib/validation/procedure";
import { ChecklistStep } from "@/types/database";
import { withIdempotency } from "@/lib/idempotency";

export interface ChecklistActionResponse {
  success?: boolean;
  error?: string;
  steps?: ChecklistStep[];
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
 * Updates all checklist steps for a procedure in batch.
 *
 * Rules:
 * - Admin session verified via verifyAdmin()
 * - Preserves existing step IDs (upsert by id) so student localStorage progress is retained
 * - Upsert & insert first, then delete removed steps (write order protects against data loss)
 * - sort_order comes from list position (10, 20, 30...)
 * - Revalidates affected public routes
 */
export async function updateChecklistBatch(
  procedureId: string,
  rawSteps: ChecklistStepInput[],
  idempotencyKey?: string
): Promise<ChecklistActionResponse> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  return withIdempotency(
    idempotencyKey,
    auth.user?.id || "admin",
    `checklist_batch:${procedureId}`,
    async () => {

  const parsed = checklistBatchSchema.safeParse({
    procedureId,
    steps: rawSteps,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const { steps } = parsed.data;

  // Demo mode handler
  if (isDemoMode()) {
    const proc = DEMO_PROCEDURES.find((p) => p.id === procedureId);
    if (!proc) {
      return { error: "Procedure not found in demo data." };
    }

    const updatedSteps: ChecklistStep[] = steps.map((s, index) => ({
      id: s.id || `demo-step-${Date.now()}-${index}`,
      procedure_id: procedureId,
      sort_order: (index + 1) * 10,
      text_en: s.text_en,
      text_ar: s.text_ar || null,
      is_critical: s.is_critical,
      phase: s.phase || null,
    }));

    proc.checklist_steps = updatedSteps;
    revalidateAffectedRoutes(proc.slug);
    return { success: true, steps: updatedSteps };
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

    // Fetch existing step IDs to detect deleted steps
    const { data: existingSteps, error: fetchError } = await supabase
      .from("checklist_steps")
      .select("id")
      .eq("procedure_id", procedureId);

    if (fetchError) {
      return { error: `Failed to fetch existing checklist steps: ${fetchError.message}` };
    }

    const incomingIds = new Set(steps.map((s) => s.id).filter(Boolean));
    const toDelete = (existingSteps || []).filter((es: any) => !incomingIds.has(es.id));

    // 1. Prepare steps with 10-interval sort_orders
    const stepsToUpsert = steps.map((step, index) => {
      const row: any = {
        procedure_id: procedureId,
        sort_order: (index + 1) * 10,
        text_en: step.text_en,
        text_ar: step.text_ar || null,
        is_critical: step.is_critical,
        phase: step.phase || null,
      };
      if (step.id) {
        row.id = step.id;
      }
      return row;
    });

    // 2. Upsert/insert first (protects data against mid-operation failure)
    let savedSteps: ChecklistStep[] = [];
    if (stepsToUpsert.length > 0) {
      const { data: upsertData, error: upsertError } = await supabase
        .from("checklist_steps")
        .upsert(stepsToUpsert, { onConflict: "id" })
        .select();

      if (upsertError) {
        return { error: `Failed to save checklist steps: ${upsertError.message}` };
      }
      savedSteps = ((upsertData || []) as ChecklistStep[]).sort(
        (a, b) => a.sort_order - b.sort_order
      );
    }

    // 3. Delete removed steps from database after successful upsert
    if (toDelete.length > 0) {
      const deleteIds = toDelete.map((s: any) => s.id);
      const { error: deleteError } = await supabase
        .from("checklist_steps")
        .delete()
        .in("id", deleteIds);

      if (deleteError) {
        console.error("Warning: failed to delete removed checklist steps:", deleteError.message);
      }
    }

    revalidateAffectedRoutes(proc.slug);
    return { success: true, steps: savedSteps };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred while saving checklist steps." };
  }
}
  );
}
