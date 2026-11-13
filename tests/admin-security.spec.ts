import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { assertTestDataSafety } from "./helpers/test-data-safety";

// T1 Safety Guard: Refuse to execute unless .env.test is configured for dedicated test project
assertTestDataSafety();

import {
  createProcedure,
  updateProcedureDetails,
  updateProcedureOverview,
  deleteProcedure,
  reorderProceduresBatch,
} from "../src/app/admin/actions/procedures";
import { updateEquipmentBatch } from "../src/app/admin/actions/equipment";
import { updateChecklistBatch } from "../src/app/admin/actions/checklist";
import { updateSiteSettings, removeLogoAction } from "../src/app/admin/actions/settings";
import { uploadImageAction, deleteImageAction } from "../src/app/admin/actions/storage";

test.describe("Phase 2A Admin Security & Authorization Suite", () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || "";

  let probeProcId: string | null = null;
  let probeListId: string | null = null;
  let probeEquipId: string | null = null;
  let probeStepId: string | null = null;

  test.afterAll(async () => {
    // Guaranteed probe cleanup even if tests fail
    if (secretKey && supabaseUrl) {
      const secretClient = createClient(supabaseUrl, secretKey);
      if (probeProcId) {
        await secretClient.from("procedures").delete().eq("id", probeProcId);
      }
      // Clean any remaining e2e-probe rows
      await secretClient.from("procedures").delete().like("slug", "e2e-probe-%");

      const { count } = await secretClient
        .from("procedures")
        .select("id", { count: "exact", head: true })
        .like("slug", "e2e-probe-%");
      console.log(`[afterAll] Remaining e2e-probe rows in DB: ${count}`);
      expect(count).toBe(0);
    }
  });

  // 1. Unauthenticated Browser Redirection
  test("Unauthenticated browser is redirected to /admin/login from all admin routes", async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    const protectedRoutes = [
      "/admin",
      "/admin/procedures/new",
      "/admin/settings",
      "/admin/preview/demo-proc-1",
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });

  // 1b. Demo Credentials Rejection in Real Mode (C1 requirement)
  test("In real mode, demo/mock credentials are unconditionally rejected at /admin/login without session creation", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto("/admin/login");

    // Attempt login with fake demo credentials
    await page.fill("#admin_email", "admin@criticalease.ps");
    await page.fill("#admin_password", "TestAdmin123!Safe");
    await page.click("button[type='submit']");

    // Must stay on login page and display Arabic generic error
    await expect(page).toHaveURL(/\/admin\/login/);
    const errorAlert = page.locator("[role='alert']").filter({ hasText: "بيانات الدخول غير صحيحة" });
    await expect(errorAlert).toBeVisible();

    // Verify no admin session cookie was set
    const cookies = await context.cookies();
    const demoCookie = cookies.find((c) => c.name === "critical_ease_demo_admin");
    expect(demoCookie).toBeUndefined();

    // Verify admin routes remain blocked
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  // 2. Server Actions Session Requirement
  test("Server actions called without an authenticated admin session reject with Unauthorized", async () => {
    const createRes = await createProcedure({
      title: "e2e-unauthorized",
      slug: "e2e-unauthorized",
      short_description: "",
      cover_alt: "",
      published: false,
    });
    expect(createRes.error).toMatch(/Unauthorized/i);

    const updateRes = await updateProcedureDetails("any-id", {
      title: "e2e-unauthorized",
      slug: "e2e-unauthorized",
      short_description: "",
      cover_alt: "",
      published: false,
    });
    expect(updateRes.error).toMatch(/Unauthorized/i);

    const overviewRes = await updateProcedureOverview("any-id", {
      definition: "test",
      indications: [],
      contraindications: [],
      common_mistakes: [],
    });
    expect(overviewRes.error).toMatch(/Unauthorized/i);

    const reorderRes = await reorderProceduresBatch([
      { id: "11111111-1111-4111-8111-111111111111", sort_order: 10 },
    ]);
    expect(reorderRes.error).toMatch(/Unauthorized/i);

    const deleteRes = await deleteProcedure("any-id", "any-title");
    expect(deleteRes.error).toMatch(/Unauthorized/i);

    const settingsRes = await updateSiteSettings({
      site_name: "Critical Ease",
      tagline: "",
      splash_cta: "",
      hero_eyebrow: "",
      hero_title: "",
      hero_description: "",
      hero_cta: "",
      footer_text: "",
    });
    expect(settingsRes.error).toMatch(/Unauthorized/i);

    const removeLogoRes = await removeLogoAction();
    expect(removeLogoRes.error).toMatch(/Unauthorized/i);

    const dummyForm = new FormData();
    dummyForm.append("file", new Blob(["dummy"]), "test.webp");
    const uploadRes = await uploadImageAction(dummyForm);
    expect(uploadRes.error).toMatch(/Unauthorized/i);

    const deleteImgRes = await deleteImageAction("covers/test.webp");
    expect(deleteImgRes.error).toMatch(/Unauthorized/i);

    // Phase 2B Server Actions
    const equipRes = await updateEquipmentBatch("11111111-1111-4111-8111-111111111111", [
      { name: "Unauthorized Equipment", sort_order: 10 },
    ]);
    expect(equipRes.error).toMatch(/Unauthorized/i);

    const checkRes = await updateChecklistBatch("11111111-1111-4111-8111-111111111111", [
      { text_en: "Unauthorized Step", sort_order: 10, is_critical: false },
    ]);
    expect(checkRes.error).toMatch(/Unauthorized/i);
  });

  // 2c. Backup Export Route Session Requirement
  test("Backup export route (/api/admin/backup) called without session rejects with 401 Unauthorized", async ({
    request,
  }) => {
    const res = await request.get("http://localhost:3000/api/admin/backup");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Unauthorized/i);
  });

  // 2b. Automated Secrets Hygiene Check
  test("Secrets hygiene: check:secrets passes across all tracked files", async () => {
    const { execSync } = await import("child_process");
    const output = execSync("npm run check:secrets", { encoding: "utf8" });
    expect(output).toContain("Zero secrets or sensitive tokens detected");
  });

  // 3. Strengthened Anonymous Real-Supabase Probe Tests with Control
  test("Anonymous access probe: draft hidden with control, writes rejected with return=representation, published readable but not writable, settings safe, storage rejected", async ({
    request,
  }) => {
    if (!supabaseUrl || !publishableKey || !secretKey) {
      throw new Error(
        "FAIL: Missing Supabase credentials in .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY required). No test may skip silently."
      );
    }

    const secretClient = createClient(supabaseUrl, secretKey);
    const timestamp = Date.now();
    const probeSlug = `e2e-probe-${timestamp}`;

    // Test Setup: Insert probe procedure (published=false) + child row in each table using secret key
    const { data: proc, error: pErr } = await secretClient
      .from("procedures")
      .insert({
        slug: probeSlug,
        title: "E2E Probe Procedure",
        published: false,
        sort_order: 9999,
      })
      .select()
      .single();
    expect(pErr).toBeNull();
    probeProcId = proc.id;

    const { data: listItem, error: lErr } = await secretClient
      .from("list_items")
      .insert({
        procedure_id: probeProcId,
        kind: "indication",
        text: "E2E Probe Indication Item",
        sort_order: 1,
      })
      .select()
      .single();
    expect(lErr).toBeNull();
    probeListId = listItem.id;

    const { data: eqItem, error: eErr } = await secretClient
      .from("equipment_items")
      .insert({
        procedure_id: probeProcId,
        name: "E2E Probe Equipment Item",
        sort_order: 1,
      })
      .select()
      .single();
    expect(eErr).toBeNull();
    probeEquipId = eqItem.id;

    const { data: stepItem, error: sErr } = await secretClient
      .from("checklist_steps")
      .insert({
        procedure_id: probeProcId,
        sort_order: 1,
        text_en: "E2E Probe Step Text EN",
        text_ar: "نص تجريبي للخطوة",
        is_critical: false,
      })
      .select()
      .single();
    expect(sErr).toBeNull();
    probeStepId = stepItem.id;

    console.log("--- STRENGTHENED ANONYMOUS REST API & STORAGE RLS PROBE ---");
    console.log(`Probe setup successful: Procedure ID = ${probeProcId}, Slug = ${probeSlug}`);

    const anonHeaders = {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    };

    // -------------------------------------------------------------------------
    // 2a. GET of draft and its children returns [] while secret-key returns them (control)
    // -------------------------------------------------------------------------
    const anonDraftGet = await request.get(
      `${supabaseUrl}/rest/v1/procedures?id=eq.${probeProcId}&select=id,slug,title,published,list_items(*),equipment_items(*),checklist_steps(*)`,
      { headers: anonHeaders }
    );
    const anonDraftGetStatus = anonDraftGet.status();
    const anonDraftGetBody = await anonDraftGet.text();
    console.log(`[2a. Anon GET draft] Status: ${anonDraftGetStatus}, Body: ${anonDraftGetBody}`);
    expect(anonDraftGetStatus).toBe(200);
    expect(JSON.parse(anonDraftGetBody)).toEqual([]);

    // Direct (not embedded) queries for draft procedure's children (C5 requirement)
    const anonListItemsDirect = await request.get(
      `${supabaseUrl}/rest/v1/list_items?procedure_id=eq.${probeProcId}`,
      { headers: anonHeaders }
    );
    expect(anonListItemsDirect.status()).toBe(200);
    expect(JSON.parse(await anonListItemsDirect.text())).toEqual([]);

    const anonEquipmentDirect = await request.get(
      `${supabaseUrl}/rest/v1/equipment_items?procedure_id=eq.${probeProcId}`,
      { headers: anonHeaders }
    );
    expect(anonEquipmentDirect.status()).toBe(200);
    expect(JSON.parse(await anonEquipmentDirect.text())).toEqual([]);

    const anonStepsDirect = await request.get(
      `${supabaseUrl}/rest/v1/checklist_steps?procedure_id=eq.${probeProcId}`,
      { headers: anonHeaders }
    );
    expect(anonStepsDirect.status()).toBe(200);
    expect(JSON.parse(await anonStepsDirect.text())).toEqual([]);

    // Control: Secret-key read of exact same rows returns them (both embedded and direct)
    const secretControlHeaders = {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    };

    const secretControlGet = await request.get(
      `${supabaseUrl}/rest/v1/procedures?id=eq.${probeProcId}&select=id,slug,title,published,list_items(*),equipment_items(*),checklist_steps(*)`,
      { headers: secretControlHeaders }
    );
    const secretControlStatus = secretControlGet.status();
    const secretControlBody = await secretControlGet.text();
    console.log(`[2a. Secret Control GET] Status: ${secretControlStatus}, Body: ${secretControlBody}`);
    expect(secretControlStatus).toBe(200);
    const controlData = JSON.parse(secretControlBody);
    expect(controlData.length).toBe(1);
    expect(controlData[0].id).toBe(probeProcId);
    expect(controlData[0].list_items.length).toBe(1);
    expect(controlData[0].equipment_items.length).toBe(1);
    expect(controlData[0].checklist_steps.length).toBe(1);

    // Direct secret control queries
    const secretListItemsDirect = await request.get(
      `${supabaseUrl}/rest/v1/list_items?procedure_id=eq.${probeProcId}`,
      { headers: secretControlHeaders }
    );
    expect(secretListItemsDirect.status()).toBe(200);
    expect(JSON.parse(await secretListItemsDirect.text()).length).toBe(1);

    const secretEquipmentDirect = await request.get(
      `${supabaseUrl}/rest/v1/equipment_items?procedure_id=eq.${probeProcId}`,
      { headers: secretControlHeaders }
    );
    expect(secretEquipmentDirect.status()).toBe(200);
    expect(JSON.parse(await secretEquipmentDirect.text()).length).toBe(1);

    const secretStepsDirect = await request.get(
      `${supabaseUrl}/rest/v1/checklist_steps?procedure_id=eq.${probeProcId}`,
      { headers: secretControlHeaders }
    );
    expect(secretStepsDirect.status()).toBe(200);
    expect(JSON.parse(await secretStepsDirect.text()).length).toBe(1);

    // -------------------------------------------------------------------------
    // 2b. PATCH & DELETE on those exact IDs with Prefer: return=representation return []
    // -------------------------------------------------------------------------
    const anonWriteHeaders = {
      ...anonHeaders,
      Prefer: "return=representation",
    };

    // PATCH procedure
    const patchProcRes = await request.patch(
      `${supabaseUrl}/rest/v1/procedures?id=eq.${probeProcId}`,
      {
        headers: anonWriteHeaders,
        data: { title: "Defaced Probe Procedure" },
      }
    );
    const patchProcStatus = patchProcRes.status();
    const patchProcBody = await patchProcRes.text();
    console.log(`[2b. Anon PATCH procedure] Status: ${patchProcStatus}, Body: ${patchProcBody}`);
    expect(patchProcStatus).toBe(200);
    expect(JSON.parse(patchProcBody)).toEqual([]);

    // DELETE procedure
    const delProcRes = await request.delete(
      `${supabaseUrl}/rest/v1/procedures?id=eq.${probeProcId}`,
      { headers: anonWriteHeaders }
    );
    const delProcStatus = delProcRes.status();
    const delProcBody = await delProcRes.text();
    console.log(`[2b. Anon DELETE procedure] Status: ${delProcStatus}, Body: ${delProcBody}`);
    expect(delProcStatus).toBe(200);
    expect(JSON.parse(delProcBody)).toEqual([]);

    // PATCH & DELETE child rows with exact IDs
    const childTables = [
      { name: "list_items", id: probeListId, patchField: "text", patchVal: "Hacked list item" },
      { name: "equipment_items", id: probeEquipId, patchField: "name", patchVal: "Hacked equipment" },
      { name: "checklist_steps", id: probeStepId, patchField: "text_en", patchVal: "Hacked step text" },
    ];

    for (const child of childTables) {
      const patchChildRes = await request.patch(
        `${supabaseUrl}/rest/v1/${child.name}?id=eq.${child.id}`,
        {
          headers: anonWriteHeaders,
          data: { [child.patchField]: child.patchVal },
        }
      );
      const patchChildStatus = patchChildRes.status();
      const patchChildBody = await patchChildRes.text();
      console.log(`[2b. Anon PATCH ${child.name}] Status: ${patchChildStatus}, Body: ${patchChildBody}`);
      expect(patchChildStatus).toBe(200);
      expect(JSON.parse(patchChildBody)).toEqual([]);

      const delChildRes = await request.delete(
        `${supabaseUrl}/rest/v1/${child.name}?id=eq.${child.id}`,
        { headers: anonWriteHeaders }
      );
      const delChildStatus = delChildRes.status();
      const delChildBody = await delChildRes.text();
      console.log(`[2b. Anon DELETE ${child.name}] Status: ${delChildStatus}, Body: ${delChildBody}`);
      expect(delChildStatus).toBe(200);
      expect(JSON.parse(delChildBody)).toEqual([]);
    }

    // Secret-key re-read shows rows completely unchanged
    const { data: recheckProc } = await secretClient
      .from("procedures")
      .select("*, list_items(*), equipment_items(*), checklist_steps(*)")
      .eq("id", probeProcId)
      .single();
    expect(recheckProc.title).toBe("E2E Probe Procedure");
    expect(recheckProc.list_items[0].text).toBe("E2E Probe Indication Item");
    expect(recheckProc.equipment_items[0].name).toBe("E2E Probe Equipment Item");
    expect(recheckProc.checklist_steps[0].text_en).toBe("E2E Probe Step Text EN");

    // -------------------------------------------------------------------------
    // 2c. Set published=true with secret key: Anon can read, but CANNOT patch or delete
    // -------------------------------------------------------------------------
    const { error: pubErr } = await secretClient
      .from("procedures")
      .update({ published: true })
      .eq("id", probeProcId);
    expect(pubErr).toBeNull();

    // Anon read now returns the published procedure and all children
    const anonPubGet = await request.get(
      `${supabaseUrl}/rest/v1/procedures?id=eq.${probeProcId}&select=id,slug,title,published,list_items(*),equipment_items(*),checklist_steps(*)`,
      { headers: anonHeaders }
    );
    const anonPubGetStatus = anonPubGet.status();
    const anonPubGetBody = await anonPubGet.text();
    console.log(`[2c. Anon GET published] Status: ${anonPubGetStatus}, Body: ${anonPubGetBody}`);
    expect(anonPubGetStatus).toBe(200);
    const pubData = JSON.parse(anonPubGetBody);
    expect(pubData.length).toBe(1);
    expect(pubData[0].id).toBe(probeProcId);
    expect(pubData[0].list_items.length).toBe(1);
    expect(pubData[0].equipment_items.length).toBe(1);
    expect(pubData[0].checklist_steps.length).toBe(1);

    // Anon still cannot PATCH published procedure
    const patchPubProcRes = await request.patch(
      `${supabaseUrl}/rest/v1/procedures?id=eq.${probeProcId}`,
      {
        headers: anonWriteHeaders,
        data: { title: "Defaced Published Procedure" },
      }
    );
    const patchPubProcStatus = patchPubProcRes.status();
    const patchPubProcBody = await patchPubProcRes.text();
    console.log(`[2c. Anon PATCH published] Status: ${patchPubProcStatus}, Body: ${patchPubProcBody}`);
    expect(patchPubProcStatus).toBe(200);
    expect(JSON.parse(patchPubProcBody)).toEqual([]);

    // Anon still cannot DELETE published procedure
    const delPubProcRes = await request.delete(
      `${supabaseUrl}/rest/v1/procedures?id=eq.${probeProcId}`,
      { headers: anonWriteHeaders }
    );
    const delPubProcStatus = delPubProcRes.status();
    const delPubProcBody = await delPubProcRes.text();
    console.log(`[2c. Anon DELETE published] Status: ${delPubProcStatus}, Body: ${delPubProcBody}`);
    expect(delPubProcStatus).toBe(200);
    expect(JSON.parse(delPubProcBody)).toEqual([]);

    // -------------------------------------------------------------------------
    // 2d. PATCH on site_settings id=1 to a different site_name returns [] and unchanged
    // -------------------------------------------------------------------------
    const { data: settingsBefore } = await secretClient
      .from("site_settings")
      .select("site_name")
      .eq("id", 1)
      .single();

    const patchSettingsRes = await request.patch(
      `${supabaseUrl}/rest/v1/site_settings?id=eq.1`,
      {
        headers: anonWriteHeaders,
        data: { site_name: "Defaced Site Name" },
      }
    );
    const patchSettingsStatus = patchSettingsRes.status();
    const patchSettingsBody = await patchSettingsRes.text();
    console.log(`[2d. Anon PATCH site_settings] Status: ${patchSettingsStatus}, Body: ${patchSettingsBody}`);
    expect(patchSettingsStatus).toBe(200);
    expect(JSON.parse(patchSettingsBody)).toEqual([]);

    // Re-read confirms site_settings.site_name is unchanged
    const { data: settingsRecheck } = await secretClient
      .from("site_settings")
      .select("site_name")
      .eq("id", 1)
      .single();
    expect(settingsRecheck).not.toBeNull();
    console.log(`[2d. Site settings re-read] site_name = ${settingsRecheck?.site_name}`);
    expect(settingsRecheck?.site_name).toBe(settingsBefore?.site_name);
    expect(settingsRecheck?.site_name).not.toBe("Defaced Site Name");

    // -------------------------------------------------------------------------
    // 2e. Storage upload of a valid image to site-images is rejected
    // -------------------------------------------------------------------------
    const validPng1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const uploadStorageRes = await request.post(
      `${supabaseUrl}/storage/v1/object/site-images/unauthorized-probe-${timestamp}.png`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          "Content-Type": "image/png",
        },
        data: validPng1x1,
      }
    );
    const uploadStorageStatus = uploadStorageRes.status();
    const uploadStorageBody = await uploadStorageRes.text();
    console.log(`[2e. Anon storage upload] Status: ${uploadStorageStatus}, Body: ${uploadStorageBody}`);
    expect([400, 401, 403]).toContain(uploadStorageStatus);
    expect(uploadStorageBody).toMatch(/violates row-level security|Unauthorized|AccessDenied/i);
  });

  // ---------------------------------------------------------------------------
  // 4. Signed-In Admin Storage Deletion (T3 Requirement)
  // ---------------------------------------------------------------------------
  test("T3: Signed-in admin session (not secret key) deletes image from site-images bucket via RLS", async () => {
    if (!supabaseUrl || !publishableKey || !secretKey) {
      throw new Error("FAIL: Missing Supabase credentials in .env.local.");
    }

    const adminEmail = process.env.E2E_ADMIN_EMAIL;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      throw new Error("FAIL: E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD missing.");
    }

    // 1. Authenticate admin user with Supabase Auth to obtain signed-in session JWT
    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false },
    });
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    expect(authError).toBeNull();
    const adminToken = authData.session?.access_token;
    expect(adminToken).toBeTruthy();

    // 2. Create client authenticated with signed-in admin user's JWT (NOT secret key!)
    const adminSessionClient = createClient(supabaseUrl, publishableKey, {
      global: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
      auth: { persistSession: false },
    });

    const testFileName = `e2e-session-delete-${Date.now()}.png`;
    const validPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    // Upload using signed-in admin session client
    const { data: uploadData, error: uploadErr } = await adminSessionClient.storage
      .from("site-images")
      .upload(testFileName, validPng, { contentType: "image/png" });
    expect(uploadErr).toBeNull();
    expect(uploadData?.path).toBe(testFileName);

    // Verify file exists before delete (using secretClient only as verification inspector)
    const secretClient = createClient(supabaseUrl, secretKey);
    const { data: listBefore } = await secretClient.storage.from("site-images").list();
    const fileExistsBefore = (listBefore || []).some((f) => f.name === testFileName);
    expect(fileExistsBefore).toBe(true);

    // 3. Perform removal using signed-in admin session client (NOT secret key!)
    // Enabled by migration 003_storage_admin_select.sql
    console.log(`[T3] Performing storage remove with adminSessionClient for file: ${testFileName}`);
    const { data: removeData, error: removeErr } = await adminSessionClient.storage
      .from("site-images")
      .remove([testFileName]);
    expect(removeErr).toBeNull();
    expect(removeData && removeData.length > 0).toBe(true);

    // 4. Verify resulting storage.objects count for this file is 0
    const { data: listAfter } = await secretClient.storage.from("site-images").list();
    const fileExistsAfter = (listAfter || []).some((f) => f.name === testFileName);
    console.log(`[T3] Storage file exists after removal by admin session client: ${fileExistsAfter}`);
    expect(fileExistsAfter).toBe(false);
  });
});
