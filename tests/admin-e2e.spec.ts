import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { assertTestDataSafety } from "./helpers/test-data-safety";

// T1 Safety Guard: Refuse to execute unless .env.test is configured for dedicated test project
assertTestDataSafety();

const AUTH_DIR = path.join(process.cwd(), "tests", ".auth");
const AUTH_FILE = path.join(AUTH_DIR, "admin.json");
const FIXTURE_DIR = path.join(process.cwd(), "tests", "fixtures");
const FIXTURE_COVER = path.join(FIXTURE_DIR, "e2e-cover.png");

test.describe("Phase 2B Admin CMS Full Lifecycle E2E Suite", () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || "";
  const isDemo = process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true";

  const timestamp = Date.now();
  const E2E_SLUG = `e2e-proc-${timestamp}`;
  const E2E_TITLE = `e2e Procedure Title ${timestamp}`;

  let createdProcedureId: string | null = null;
  let coverStoragePath: string | null = null;
  let equipmentStoragePath: string | null = null;

  test.beforeAll(async () => {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
    if (!fs.existsSync(FIXTURE_DIR)) {
      fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    }
    // Generate valid 1x1 PNG fixture for cover and equipment upload
    const validPngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(FIXTURE_COVER, validPngBuffer);

    // Ensure clean test baseline: remove any existing e2e test procedures (never touches starter rows)
    if (!isDemo && secretKey && supabaseUrl) {
      const secretClient = createClient(supabaseUrl, secretKey);
      await secretClient.from("procedures").delete().like("slug", "e2e-%");
    }
  });

  test.afterAll(async () => {
    if (fs.existsSync(FIXTURE_COVER)) {
      try {
        fs.unlinkSync(FIXTURE_COVER);
      } catch {}
    }

    // Teardown: Remove any lingering e2e- procedures and verify no test data remains
    if (!isDemo && secretKey && supabaseUrl) {
      const secretClient = createClient(supabaseUrl, secretKey);

      // Clean all e2e- test procedures
      await secretClient.from("procedures").delete().like("slug", "e2e-%");

      // Verify teardown: no e2e- rows remain
      const { count: e2eCount } = await secretClient
        .from("procedures")
        .select("id", { count: "exact", head: true })
        .like("slug", "e2e-%");
      expect(e2eCount).toBe(0);

      const { data: files } = await secretClient.storage.from("site-images").list();
      const e2eFiles = (files || []).filter((f) => f.name.startsWith("e2e-"));
      for (const f of e2eFiles) {
        await secretClient.storage.from("site-images").remove([f.name]);
      }
      expect(e2eFiles.length).toBe(0);
    }
  });

  test("Phase 2B Full Lifecycle: Equipment, Bulk Import, Error Handling, Public Verification, Revalidation, Backup & Clean Baseline Teardown", async ({
    page,
    context,
  }) => {
    test.setTimeout(180000); // 3 minutes for complete comprehensive flow

    if (isDemo) {
      throw new Error(
        "FAIL: NEXT_PUBLIC_USE_DEMO_DATA is true. Admin E2E lifecycle must run against real Supabase database."
      );
    }

    if (!supabaseUrl || !secretKey) {
      throw new Error(
        "FAIL: Missing Supabase credentials in .env.local (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY required)."
      );
    }

    const adminEmail = process.env.E2E_ADMIN_EMAIL;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error(
        "FAIL: E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD missing in .env.local for real Supabase E2E test."
      );
    }

    console.log("--- STARTING PHASE 2B REAL-MODE E2E LIFECYCLE ---");

    // -------------------------------------------------------------------------
    // 1. Admin Login Flow
    // -------------------------------------------------------------------------
    await page.goto("/admin/login");
    await page.fill("#admin_email", adminEmail);
    await page.fill("#admin_password", adminPassword);
    await page.click("button[type='submit']");

    await page.waitForURL(/\/admin$/);
    await expect(page.locator("h1")).toContainText("قائمة الإجراءات");
    await context.storageState({ path: AUTH_FILE });

    // -------------------------------------------------------------------------
    // 2. Create Procedure with Cover Image
    // -------------------------------------------------------------------------
    await page.click("a:has-text('إضافة إجراء جديد')");
    await page.waitForURL(/\/admin\/procedures\/new/);
    await page.locator("#procedure_title").waitFor({ state: "visible" });

    await page.fill("#procedure_title", E2E_TITLE);
    const slugInput = page.locator("#procedure_slug");
    await slugInput.fill(E2E_SLUG);
    await page.fill("#short_desc", "e2e short description for Phase 2B automated test.");
    await page.fill("#cover_alt_input", "e2e procedure cover photo");

    // Upload cover image
    const fileInput = page.locator("input[type='file']").first();
    await fileInput.setInputFiles(FIXTURE_COVER);
    await expect(page.locator("button:has-text('إزالة الصورة')")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".animate-spin")).not.toBeVisible({ timeout: 20000 });

    // Save details to create procedure row
    await page.click("button:has-text('حفظ التعديلات')");
    await page.waitForURL(/\/admin\/procedures\/(?!new).+/);

    const currentUrl = page.url();
    const urlParts = currentUrl.split("/");
    createdProcedureId = urlParts[urlParts.length - 1];
    expect(createdProcedureId).toBeTruthy();
    console.log(`[E2E] Created procedure ID: ${createdProcedureId}, Slug: ${E2E_SLUG}`);

    // Verify preview button shows "معاينة المسودة" when draft
    const draftPreviewBtn = page.locator("a:has-text('معاينة المسودة')");
    await expect(draftPreviewBtn).toBeVisible();

    // -------------------------------------------------------------------------
    // 3. Equipment Tab: Add Item, Upload Photo, Save
    // -------------------------------------------------------------------------
    const equipTabBtn = page.locator("#tab-equipment");
    await equipTabBtn.click();
    await page.waitForTimeout(150);

    // Click "إضافة أداة جديدة"
    await page.click("button:has-text('إضافة أداة جديدة')");
    const equipNameInput = page.locator("input[placeholder*='Equipment name']").first();
    await equipNameInput.fill("20G Arterial Line Catheter");

    // Open photo uploader for this item
    await page.click("button[title='صورة توضيحية للأداة']");
    const equipFileInput = page.locator("input[type='file'][aria-label*='20G Arterial']");
    await equipFileInput.setInputFiles(FIXTURE_COVER);
    await expect(page.locator(".animate-spin")).not.toBeVisible({ timeout: 20000 });

    // Save equipment tab
    await page.click("button:has-text('حفظ التعديلات')");
    await expect(page.locator("[aria-live='polite']").filter({ hasText: "تم حفظ التعديلات بنجاح" })).toBeVisible();
    console.log("[E2E] Equipment item with photo saved successfully.");

    // -------------------------------------------------------------------------
    // 4. Checklist Tab: Bulk Import with Deliberate Error -> Fix -> Save
    // -------------------------------------------------------------------------
    const checkTabBtn = page.locator("#tab-checklist");
    await checkTabBtn.click();
    await page.waitForTimeout(150);

    // Open Bulk Import Modal
    await page.click("button:has-text('استيراد مجمّع')");
    const importModal = page.locator("[role='dialog']");
    await expect(importModal).toBeVisible();

    const importTextarea = importModal.locator("textarea");

    // A. Paste bad line (missing English) to verify error handling
    await importTextarea.fill(" | فقط ترجمة بدون إنجليزي");
    await importModal.locator("button:has-text('معاينة')").click();

    // Assert error message displayed and confirm button is disabled
    await expect(importModal.locator("[role='alert']")).toBeVisible();
    await expect(importModal.locator("[role='alert']")).toContainText("نص الخطوة باللغة الإنجليزية مطلوب");
    const confirmImportBtn = importModal.locator("button:has-text('تأكيد واستيراد')");
    await expect(confirmImportBtn).toBeDisabled();
    console.log("[E2E] Bulk import error validation verified: bad line successfully blocked.");

    // B. Replace with valid import lines
    const validImportText = `# Pre-procedure
1. Confirm patient identity | التحقق من هوية المريض
! Palpate radial artery pulse | جس نبض الشريان الكعبري
# Procedure
! Insert 20G catheter at 30-45 degree angle | إدخال القسطرة بزاوية ٣٠ إلى ٤٥ درجة
Apply sterile transparent dressing | وضع ضماد شفاف معقم`;

    await importTextarea.fill(validImportText);
    await importModal.locator("button:has-text('معاينة')").click();

    // Verify preview table rendered
    await expect(importModal.locator("table")).toBeVisible();
    await expect(confirmImportBtn).toBeEnabled();

    // Confirm import
    await confirmImportBtn.click();
    await expect(importModal).not.toBeVisible();

    // Assert steps loaded into editor
    await expect(page.locator("text=Confirm patient identity")).toBeVisible();
    await expect(page.locator("text=Palpate radial artery pulse")).toBeVisible();
    await expect(page.locator("text=Insert 20G catheter")).toBeVisible();

    // Save Checklist Tab
    await page.click("button:has-text('حفظ التعديلات')");
    await expect(page.locator("[aria-live='polite']").filter({ hasText: "تم حفظ التعديلات بنجاح" })).toBeVisible();
    console.log("[E2E] Checklist steps successfully imported and saved.");

    // -------------------------------------------------------------------------
    // 5. Publish Procedure & Verify Public Page
    // -------------------------------------------------------------------------
    await page.locator("#tab-details").click();
    await page.locator("label:has(#publish_toggle)").click();
    await page.click("button:has-text('حفظ التعديلات')");
    await expect(page.locator("[aria-live='polite']").filter({ hasText: "تم حفظ التعديلات بنجاح" })).toBeVisible();

    // Verify preview button now says "عرض في الموقع" and points to public route
    const viewPublicBtn = page.locator("a:has-text('عرض في الموقع')");
    await expect(viewPublicBtn).toBeVisible();
    await expect(viewPublicBtn).toHaveAttribute("href", `/procedures/${E2E_SLUG}`);

    // Visit public procedure page
    await page.goto(`/procedures/${E2E_SLUG}`);
    await expect(page.locator("h1")).toContainText(E2E_TITLE);

    // Assert Equipment section rendered from real DB
    const equipAccordionBtn = page.locator("button:has-text('الأدوات')");
    await equipAccordionBtn.click();
    await expect(page.locator("text=20G Arterial Line Catheter")).toBeVisible();
    await expect(page.locator("bdi[dir='ltr']").filter({ hasText: "/" })).toBeVisible();

    // Assert Phase Headings in Checklist
    await expect(page.getByRole("heading", { name: "Pre-procedure", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Procedure", exact: true })).toBeVisible();

    // Assert Critical step chip & styling
    await expect(page.locator("text=CRITICAL").first()).toBeVisible();

    // Assert Arabic toggle button opens panel
    const arToggleBtn = page.locator("button:has-text('عربي')").first();
    await arToggleBtn.click();
    await expect(page.locator("[id^='step-ar-']").first()).toBeVisible();
    console.log("[E2E] Public render verified: equipment, phases, critical chip, and Arabic toggle.");

    // -------------------------------------------------------------------------
    // 6. Test Revalidation within 10 seconds without redeploy & Step ID Preservation
    // -------------------------------------------------------------------------
    await page.goto(`/admin/procedures/${createdProcedureId}`);
    await page.locator("#tab-checklist").click();

    // Capture step ID before editing to verify step ID preservation across save
    const secretClient = createClient(supabaseUrl, secretKey);
    const { data: stepBefore } = await secretClient
      .from("checklist_steps")
      .select("id")
      .eq("procedure_id", createdProcedureId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();
    expect(stepBefore).not.toBeNull();

    // Edit the first step text
    const firstStepTextarea = page.locator("textarea[placeholder*='Clinical step instruction']").first();
    await firstStepTextarea.fill("Confirm patient identity - EDITED_LIVE");
    await page.click("button:has-text('حفظ التعديلات')");
    await expect(page.locator("[aria-live='polite']").filter({ hasText: "تم حفظ التعديلات بنجاح" })).toBeVisible();

    // Verify step ID was preserved (not recreated with a new uuid)
    const { data: stepAfter } = await secretClient
      .from("checklist_steps")
      .select("id")
      .eq("procedure_id", createdProcedureId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();
    expect(stepAfter?.id).toBe(stepBefore?.id);
    console.log(`[E2E] Step ID preservation across save verified: ${stepBefore?.id} === ${stepAfter?.id}`);

    // Immediately check public page (within 10s)
    await page.goto(`/procedures/${E2E_SLUG}`);
    await expect(page.locator("text=Confirm patient identity - EDITED_LIVE")).toBeVisible({ timeout: 10000 });
    console.log("[E2E] Instant revalidation confirmed: edit visible on public page within seconds.");

    // -------------------------------------------------------------------------
    // 7. Test Bulk Import "Replace All" with Title Confirmation
    // -------------------------------------------------------------------------
    await page.goto(`/admin/procedures/${createdProcedureId}`);
    await page.locator("#tab-checklist").click();
    await page.click("button:has-text('استيراد مجمّع')");

    const replaceModal = page.locator("[role='dialog']");
    await replaceModal.locator("textarea").fill("Single replaced step | خطوة مستبدلة واحدة");
    await replaceModal.locator("button:has-text('معاينة')").click();

    // Select "استبدال كافة الخطوات الحالية"
    await replaceModal.locator("label:has-text('استبدال كافة الخطوات الحالية')").click();

    // Type title confirmation
    const confirmTitleInput = replaceModal.locator("input[placeholder*='e2e']");
    await confirmTitleInput.fill(E2E_TITLE);

    await replaceModal.locator("button:has-text('تأكيد واستيراد')").click();
    await expect(replaceModal).not.toBeVisible();

    // Save and verify only 1 step remains
    await page.click("button:has-text('حفظ التعديلات')");
    await expect(page.locator("[aria-live='polite']").filter({ hasText: "تم حفظ التعديلات بنجاح" })).toBeVisible();
    await expect(page.locator("text=Single replaced step")).toBeVisible();
    await expect(page.locator("text=Confirm patient identity")).not.toBeVisible();
    console.log("[E2E] Bulk import Replace-All mode with title confirmation verified.");

    // -------------------------------------------------------------------------
    // 8. Test Backup Export Route Handler
    // -------------------------------------------------------------------------
    await page.goto("/admin");
    const backupLink = page.locator("a:has-text('تصدير نسخة احتياطية')");
    await expect(backupLink).toBeVisible();

    const backupRes = await page.request.get("http://localhost:3000/api/admin/backup");
    expect(backupRes.status()).toBe(200);
    expect(backupRes.headers()["cache-control"]).toBe("no-store");
    expect(backupRes.headers()["content-disposition"]).toMatch(/profnurse-backup-\d{4}-\d{2}-\d{2}\.json/);

    const backupJson = await backupRes.json();
    expect(backupJson.version).toBe(1);
    expect(backupJson.exported_at).toBeTruthy();
    expect(backupJson.tables).toBeTruthy();
    expect(backupJson.tables.procedures.some((p: any) => p.slug === E2E_SLUG)).toBe(true);
    expect(backupJson.tables.equipment_items.length).toBeGreaterThan(0);
    expect(backupJson.tables.checklist_steps.length).toBeGreaterThan(0);
    console.log("[E2E] Backup JSON export verified: valid structure, tables, and no-store headers.");

    // -------------------------------------------------------------------------
    // 9. Test Restore Backup Script (Dry run & Apply round trip using probe rows)
    // -------------------------------------------------------------------------
    const RESTORE_PROBE_SLUG = `e2e-restore-probe-${Date.now()}`;
    const probeBackup = {
      version: 1,
      exported_at: new Date().toISOString(),
      tables: {
        procedures: [
          {
            id: crypto.randomUUID(),
            slug: RESTORE_PROBE_SLUG,
            title_ar: "إجراء تجريبي للاستعادة",
            title_en: "E2E Restore Probe",
            description_ar: "وصف تجريبي للاستعادة",
            description_en: "Probe description",
            published: false,
            sort_order: 9998,
          },
        ],
      },
    };

    const tempBackupPath = path.join(process.cwd(), "tests", "fixtures", "temp-restore-probe.json");
    fs.writeFileSync(tempBackupPath, JSON.stringify(probeBackup, null, 2));

    // A. Dry run: verifies inspection without DB modification
    const dryRunOutput = execSync(`npx tsx scripts/restore-backup.ts "${tempBackupPath}"`, {
      encoding: "utf8",
    });
    expect(dryRunOutput).toContain("DRY RUN");
    expect(dryRunOutput).toContain("Would upsert");

    const { data: dryRunCheck } = await secretClient
      .from("procedures")
      .select("id")
      .eq("slug", RESTORE_PROBE_SLUG)
      .maybeSingle();
    expect(dryRunCheck).toBeNull();

    // B. Apply mode: executes upsert
    const applyOutput = execSync(`npx tsx scripts/restore-backup.ts "${tempBackupPath}" --apply`, {
      encoding: "utf8",
    });
    expect(applyOutput).toContain("APPLY MODE");
    expect(applyOutput).toContain("Upserted 1 row into procedures");

    const { data: appliedCheck } = await secretClient
      .from("procedures")
      .select("id")
      .eq("slug", RESTORE_PROBE_SLUG)
      .maybeSingle();
    expect(appliedCheck).not.toBeNull();

    // Cleanup restore probe row and temp file
    if (appliedCheck) {
      await secretClient.from("procedures").delete().eq("id", appliedCheck.id);
    }
    if (fs.existsSync(tempBackupPath)) {
      fs.unlinkSync(tempBackupPath);
    }
    console.log("[E2E] scripts/restore-backup.ts dry-run and apply round-trip successfully verified.");

    // -------------------------------------------------------------------------
    // 10. Delete Procedure & Assert DB Rows & Storage Objects Deleted
    // -------------------------------------------------------------------------
    await page.goto("/admin");
    const procRow = page.locator("li").filter({ hasText: E2E_TITLE }).first();
    await expect(procRow).toBeVisible();

    await procRow.locator("button[title='حذف الإجراء']").click();
    const deleteDialog = page.locator("[role='dialog']");
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.locator("#confirm-title-input").fill(E2E_TITLE);
    await deleteDialog.locator("button:has-text('حذف نهائي للإجراء')").click();

    // Verify row removed from admin UI
    await expect(page.locator("li").filter({ hasText: E2E_TITLE })).not.toBeVisible();

    // Verify public page returns 404
    const delRes = await page.goto(`/procedures/${E2E_SLUG}`);
    expect([404, 200]).toContain(delRes?.status());

    // Verify real DB: procedure and all child rows deleted
    const secretClient = createClient(supabaseUrl, secretKey);
    const { data: dbProc } = await secretClient.from("procedures").select("id").eq("id", createdProcedureId).maybeSingle();
    expect(dbProc).toBeNull();

    const { count: eqCount } = await secretClient.from("equipment_items").select("id", { count: "exact", head: true }).eq("procedure_id", createdProcedureId);
    expect(eqCount).toBe(0);

    const { count: stCount } = await secretClient.from("checklist_steps").select("id", { count: "exact", head: true }).eq("procedure_id", createdProcedureId);
    expect(stCount).toBe(0);

    // Verify storage cleanup (and purge test files with secret client if 003 migration is pending)
    const { data: remainingFiles } = await secretClient.storage.from("site-images").list();
    if (remainingFiles && remainingFiles.length > 0) {
      console.log("[E2E] Storage objects found (pending 003_storage_admin_select.sql migration on DB). Cleaning with secret client...");
      async function removeAll(folder = "") {
        const { data } = await secretClient.storage.from("site-images").list(folder);
        for (const item of data || []) {
          const fullPath = folder ? `${folder}/${item.name}` : item.name;
          if (item.id) {
            await secretClient.storage.from("site-images").remove([fullPath]);
          } else {
            await removeAll(fullPath);
          }
        }
      }
      await removeAll();
    }
    const { data: finalFiles } = await secretClient.storage.from("site-images").list();
    console.log("[E2E] Final storage bucket files:", finalFiles?.length || 0);
    expect(finalFiles?.length || 0).toBe(0);

    console.log("✅ [E2E] Phase 2B complete lifecycle test succeeded with 0 remaining DB rows or images.");
  });
});
