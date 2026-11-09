import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/admin";
import { isDemoMode } from "@/lib/data";
import { DEMO_PROCEDURES, DEMO_SITE_SETTINGS } from "@/data/demo-data";

export const dynamic = "force-dynamic";

/**
 * Admin-only backup export route.
 *
 * Requirements:
 * - Verifies session and public.is_admin() on the server
 * - Uses the signed-in session (not secret key)
 * - Returns JSON { version: 1, exported_at, tables: { site_settings, procedures, list_items, equipment_items, checklist_steps } } including drafts
 * - Cache-Control: no-store
 * - filename: profnurse-backup-YYYY-MM-DD.json
 */
export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized: admin session required." }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  const filename = `profnurse-backup-${dateStr}.json`;

  if (isDemoMode()) {
    const listItems: any[] = [];
    const equipmentItems: any[] = [];
    const checklistSteps: any[] = [];

    for (const proc of DEMO_PROCEDURES) {
      if (proc.list_items) listItems.push(...proc.list_items);
      if (proc.equipment_items) equipmentItems.push(...proc.equipment_items);
      if (proc.checklist_steps) checklistSteps.push(...proc.checklist_steps);
    }

    const payload = {
      version: 1,
      exported_at: now.toISOString(),
      tables: {
        site_settings: [DEMO_SITE_SETTINGS],
        procedures: DEMO_PROCEDURES.map(({ list_items, equipment_items, checklist_steps, ...rest }) => rest),
        list_items: listItems,
        equipment_items: equipmentItems,
        checklist_steps: checklistSteps,
      },
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  try {
    const supabase = auth.supabase;

    // Fetch all tables using authenticated session
    const [settingsRes, procsRes, listRes, equipRes, stepsRes] = await Promise.all([
      supabase.from("site_settings").select("*").order("id"),
      supabase.from("procedures").select("*").order("sort_order"),
      supabase.from("list_items").select("*").order("sort_order"),
      supabase.from("equipment_items").select("*").order("sort_order"),
      supabase.from("checklist_steps").select("*").order("sort_order"),
    ]);

    if (settingsRes.error) throw new Error(settingsRes.error.message);
    if (procsRes.error) throw new Error(procsRes.error.message);
    if (listRes.error) throw new Error(listRes.error.message);
    if (equipRes.error) throw new Error(equipRes.error.message);
    if (stepsRes.error) throw new Error(stepsRes.error.message);

    const backupPayload = {
      version: 1,
      exported_at: now.toISOString(),
      tables: {
        site_settings: settingsRes.data || [],
        procedures: procsRes.data || [],
        list_items: listRes.data || [],
        equipment_items: equipRes.data || [],
        checklist_steps: stepsRes.data || [],
      },
    };

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate database backup." },
      { status: 500 }
    );
  }
}
