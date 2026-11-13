import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load env vars from .env.local without external dotenv
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function verifyAnonRLS() {
  console.log("================================================================================");
  console.log("🛡️ ANONYMOUS RLS & SIGN-UP SECURITY PROBES (READ-ONLY / REJECTION AUDIT)");
  console.log("================================================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;

  console.log(`Target Supabase URL: ${supabaseUrl}`);
  console.log(`Using Public Anon Key: ${anonKey ? anonKey.slice(0, 15) + "..." : "MISSING"}`);

  const anonClient = createClient(supabaseUrl, anonKey);

  // 1. Probing draft procedure read with anon key
  const { data: anonProcs, error: procErr } = await anonClient
    .from("procedures")
    .select("id, slug, published");

  console.log(`1. Anonymous read 'procedures':`, {
    returnedRowCount: anonProcs?.length || 0,
    expected: 0, // all 5 starters are published: false
    pass: (anonProcs?.length || 0) === 0 ? "✅ PASS (Drafts hidden)" : "❌ FAIL",
  });

  // 2. Probing unauthorized insert with anon key
  const { data: insertData, error: insertErr } = await anonClient
    .from("procedures")
    .insert([{ title: "Probe Attack", slug: "probe-attack", published: false }])
    .select();

  console.log(`2. Anonymous write 'procedures':`, {
    error: insertErr?.message,
    code: insertErr?.code,
    pass: insertErr ? "✅ PASS (Rejected by RLS)" : "❌ FAIL (Write allowed!)",
  });

  // 3. Probing unauthorized update on site_settings with anon key
  const { data: updateData, error: updateErr } = await anonClient
    .from("site_settings")
    .update({ site_name: "Defaced Site" })
    .eq("id", "00000000-0000-0000-0000-000000000001")
    .select();

  console.log(`3. Anonymous write 'site_settings':`, {
    error: updateErr?.message,
    returnedRows: updateData?.length || 0,
    pass: (updateErr || (updateData?.length || 0) === 0) ? "✅ PASS (Rejected by RLS)" : "❌ FAIL",
  });

  // 4. Probing storage bucket 'site-images' anonymous upload
  const dummyBuffer = Buffer.from("fake image bytes");
  const { data: uploadData, error: uploadErr } = await anonClient.storage
    .from("site-images")
    .upload("probe-attack.png", dummyBuffer, { contentType: "image/png" });

  console.log(`4. Anonymous upload to 'site-images' bucket:`, {
    error: uploadErr?.message,
    pass: uploadErr ? "✅ PASS (Rejected by Storage RLS)" : "❌ FAIL",
  });

  // 5. Probing sign-ups disabled
  const { data: signUpData, error: signUpErr } = await anonClient.auth.signUp({
    email: "random-attacker-test@example.com",
    password: "Password123!@#",
  });

  console.log(`5. Anonymous sign-up probe:`, {
    error: signUpErr?.message,
    userCreated: !!signUpData?.user,
    pass: signUpErr || !signUpData?.user ? "✅ PASS (Sign-ups rejected / restricted)" : "⚠️ User created",
  });
}

verifyAnonRLS().catch(console.error);
