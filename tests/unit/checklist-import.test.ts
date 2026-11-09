import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseChecklistImport,
  normalizeChecklistText,
} from "../../src/lib/import/checklist";

describe("Checklist Bulk Import Parser & Normalizer", () => {
  // 1. Basic step without Arabic or Phase
  it("1. parses a simple single English step", () => {
    const input = "Confirm patient identity and consent.";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps.length, 1);
    assert.equal(result.steps[0].text_en, "Confirm patient identity and consent.");
    assert.equal(result.steps[0].text_ar, null);
    assert.equal(result.steps[0].is_critical, false);
    assert.equal(result.steps[0].phase, null);
  });

  // 2. Step with English and Arabic
  it("2. parses step with both English and Arabic separated by pipe", () => {
    const input = "Wash hands thoroughly | غسل اليدين جيدًا بالماء والصابون";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].text_en, "Wash hands thoroughly");
    assert.equal(result.steps[0].text_ar, "غسل اليدين جيدًا بالماء والصابون");
  });

  // 3. Leading critical flag !
  it("3. parses leading critical '!' flag", () => {
    const input = "! Check for pulse before defibrillation | التحقق من النبض قبل إزالة الرجفان";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].is_critical, true);
    assert.equal(result.steps[0].text_en, "Check for pulse before defibrillation");
  });

  // 4. Critical flag without space after !
  it("4. parses critical flag without whitespace after '!'", () => {
    const input = "!Administer epinephrine immediately";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].is_critical, true);
    assert.equal(result.steps[0].text_en, "Administer epinephrine immediately");
  });

  // 5. Phase header applies to following lines
  it("5. sets phase for subsequent step lines", () => {
    const input = `# Preparation
Gather sterile drape
Inspect sterile packaging`;
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps.length, 2);
    assert.equal(result.steps[0].phase, "Preparation");
    assert.equal(result.steps[1].phase, "Preparation");
  });

  // 6. Phase change updates following steps
  it("6. updates phase when a new phase header is encountered", () => {
    const input = `# Phase 1
Step A
# Phase 2
Step B`;
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].phase, "Phase 1");
    assert.equal(result.steps[1].phase, "Phase 2");
  });

  // 7. Empty phase reset with '#' alone
  it("7. resets phase to null when '#' alone is encountered", () => {
    const input = `# Phase 1
Step A
#
Step B without phase`;
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].phase, "Phase 1");
    assert.equal(result.steps[1].phase, null);
  });

  // 8. First pipe split (extra pipes remain in Arabic)
  it("8. splits at the first pipe; subsequent pipes remain in the Arabic text", () => {
    const input = "Monitor telemetry | مراقبة الشاشة | القراءة الأولية";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].text_en, "Monitor telemetry");
    assert.equal(result.steps[0].text_ar, "مراقبة الشاشة | القراءة الأولية");
  });

  // 9. Empty Arabic part after pipe
  it("9. treats empty Arabic part after pipe as null", () => {
    const input = "Check baseline vital signs |   ";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].text_en, "Check baseline vital signs");
    assert.equal(result.steps[0].text_ar, null);
  });

  // 10. CRLF line endings (Windows carriage returns)
  it("10. correctly parses CRLF (\\r\\n) line breaks", () => {
    const input = "Step one\r\nStep two\r\nStep three";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps.length, 3);
  });

  // 11. Blank lines are ignored
  it("11. ignores blank lines and whitespace-only lines", () => {
    const input = `
Step one

   \t
Step two

`;
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps.length, 2);
  });

  // 12. Trimming runs of spaces and tabs
  it("12. collapses runs of spaces and tabs in fields", () => {
    const input = "  Perform \t modified   Allen test  |   إجراء   اختبار   ألين   ";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].text_en, "Perform modified Allen test");
    assert.equal(result.steps[0].text_ar, "إجراء اختبار ألين");
  });

  // 13. Unicode NFC Normalization
  it("13. applies Unicode NFC normalization", () => {
    const decomposed = "e\u0301tape pre\u0301liminaire"; // e + acute accent
    const result = parseChecklistImport(decomposed);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].text_en, "étape préliminaire");
  });

  // 14. Stripping bidi override characters (U+202A to U+202E)
  it("14. strips bidi override/embedding characters (U+202A..U+202E)", () => {
    const input = "Step with \u202Aoverride\u202C and \u202Eembed\u202C | نص مع \u202Bتوجيه\u202C";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].text_en, "Step with override and embed");
    assert.equal(result.steps[0].text_ar, "نص مع توجيه");
  });

  // 15. Stripping bidi isolate characters (U+2066 to U+2069)
  it("15. strips bidi isolate characters (U+2066..U+2069)", () => {
    const input = "Step \u2066isolated\u2069 text | نص \u2067معزول\u2069";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps[0].text_en, "Step isolated text");
    assert.equal(result.steps[0].text_ar, "نص معزول");
  });

  // 16. Preserving legitimate LRM, RLM, ZWJ, and ZWNJ
  it("16. preserves directional marks LRM (\\u200E), RLM (\\u200F), ZWJ (\\u200D), and ZWNJ (\\u200C)", () => {
    const input = "Blood pressure \u200E120/80\u200E mmHg | ضغط الدم \u200F١٢٠/٨٠\u200F";
    const norm = normalizeChecklistText(input);
    assert.equal(norm.includes("\u200E"), true);
    assert.equal(norm.includes("\u200F"), true);
  });

  // 17. Warning on leading numbering like "1." or "2)"
  it("17. emits a non-blocking warning for leading numbering e.g. '1.'", () => {
    const input = "1. Confirm order\n2) Verify site\n3- Position patient";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.warnings.length, 3);
    assert.equal(result.warnings[0].message.includes("ترقيم يدوي"), true);
    assert.equal((result.steps[0].warnings || []).length, 1);
  });

  // 18. Warning on duplicate English lines
  it("18. emits a non-blocking warning for duplicate English lines", () => {
    const input = `Verify patency of catheter
Clean insertion site
Verify patency of catheter`;
    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.warnings.length, 1);
    assert.equal(result.warnings[0].line, 3);
    assert.equal(result.warnings[0].message.includes("مكرر تمامًا"), true);
  });

  // 19. Error on missing English (empty before pipe)
  it("19. rejects line with empty English before pipe with clear line number", () => {
    const input = "Valid step\n | فقط ترجمة عربية بدون إنجليزي";
    const result = parseChecklistImport(input);
    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].line, 2);
    assert.equal(result.errors[0].message.includes("نص الخطوة باللغة الإنجليزية مطلوب"), true);
  });

  // 20. Error on over-length English (> 500 chars)
  it("20. rejects step when English exceeds 500 characters", () => {
    const longEn = "A".repeat(501);
    const input = `${longEn} | ترجمة`;
    const result = parseChecklistImport(input);
    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].message.includes("يتجاوز 500 حرف"), true);
  });

  // 21. Error on over-length Arabic (> 500 chars)
  it("21. rejects step when Arabic exceeds 500 characters", () => {
    const longAr = "ض".repeat(501);
    const input = `Valid step | ${longAr}`;
    const result = parseChecklistImport(input);
    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].message.includes("يتجاوز 500 حرف"), true);
  });

  // 22. Error on over-length phase (> 80 chars)
  it("22. rejects phase header exceeding 80 characters", () => {
    const longPhase = "P".repeat(81);
    const input = `# ${longPhase}\nValid step`;
    const result = parseChecklistImport(input);
    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].message.includes("يتجاوز الحد الأقصى (80 حرفًا)"), true);
  });

  // 23. Error on over 200 lines per import
  it("23. rejects input exceeding 200 step lines", () => {
    const lines = Array.from({ length: 205 }, (_, i) => `Step ${i + 1}`).join("\n");
    const result = parseChecklistImport(lines);
    assert.equal(result.valid, false);
    assert.equal(result.errors.some((e) => e.message.includes("200 خطوة")), true);
  });

  // 24. Empty input handling
  it("24. rejects empty or all-whitespace input", () => {
    const result = parseChecklistImport("   \n\t\n   ");
    assert.equal(result.valid, false);
    assert.equal(result.errors[0].message.includes("النص المُدخل فارغ"), true);
  });

  // 25. Mixed complex scenario with phases, critical, Arabic, duplicates, and numbering
  it("25. correctly parses mixed complex clinical import", () => {
    const input = `# Pre-procedure
1. Confirm patient identity | التحقق من هوية المريض
! Palpate radial artery pulse | جس نبض الشريان الكعبري
# Procedure
! Insert 20G catheter at 30-45 degree angle | إدخال القسطرة بزاوية ٣٠ إلى ٤٥ درجة
Observe blood flashback
#
Apply pressure dressing | وضع ضماد ضاغط`;

    const result = parseChecklistImport(input);
    assert.equal(result.valid, true);
    assert.equal(result.steps.length, 5);

    // Step 1: Pre-procedure, not critical, has warning
    assert.equal(result.steps[0].phase, "Pre-procedure");
    assert.equal(result.steps[0].is_critical, false);
    assert.equal((result.steps[0].warnings || []).length, 1);

    // Step 2: Pre-procedure, critical
    assert.equal(result.steps[1].phase, "Pre-procedure");
    assert.equal(result.steps[1].is_critical, true);

    // Step 3: Procedure, critical
    assert.equal(result.steps[2].phase, "Procedure");
    assert.equal(result.steps[2].is_critical, true);

    // Step 4: Procedure, not critical
    assert.equal(result.steps[3].phase, "Procedure");
    assert.equal(result.steps[3].is_critical, false);

    // Step 5: Cleared phase (null)
    assert.equal(result.steps[4].phase, null);
    assert.equal(result.steps[4].is_critical, false);
  });
});
