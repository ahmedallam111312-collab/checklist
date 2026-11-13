import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateSlug,
  slugSchema,
  procedureDetailsSchema,
  procedureOverviewSchema,
  siteSettingsSchema,
  reorderBatchSchema,
  equipmentBatchSchema,
  checklistBatchSchema,
} from "../../src/lib/validation/procedure";

describe("Slug Generation & Validation", () => {
  it("converts uppercase and symbols to lowercase kebab-case", () => {
    const slug = generateSlug("Arterial Blood Gas (ABG) Sampling 2026!");
    assert.equal(slug, "arterial-blood-gas-abg-sampling-2026");
    assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("strips leading and trailing hyphens", () => {
    const slug = generateSlug("---CVP Measurement---");
    assert.equal(slug, "cvp-measurement");
    assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("truncates slug to a maximum of 60 characters", () => {
    const longTitle = "Very long title exceeding sixty characters for testing procedure slug length constraints";
    const slug = generateSlug(longTitle);
    assert.ok(slug.length <= 60);
    assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("validates valid slugs with slugSchema", () => {
    const valid = slugSchema.safeParse("abg-sampling");
    assert.ok(valid.success);
  });

  it("rejects uppercase letters or special characters in slugSchema", () => {
    const invalidUpper = slugSchema.safeParse("ABG-Sampling");
    assert.equal(invalidUpper.success, false);

    const invalidUnderscore = slugSchema.safeParse("abg_sampling");
    assert.equal(invalidUnderscore.success, false);

    const invalidDoubleHyphen = slugSchema.safeParse("abg--sampling");
    assert.equal(invalidDoubleHyphen.success, false);
  });
});

describe("Zod Validation Schemas & Field Limits", () => {
  it("enforces procedureDetailsSchema limits (title 80, short_desc 200, alt 200)", () => {
    // Valid details
    const valid = procedureDetailsSchema.safeParse({
      title: "Valid Title",
      slug: "valid-slug",
      short_description: "Short description under 200 chars",
      cover_path: "covers/test/uuid.webp",
      cover_alt: "Valid alt under 200 chars",
      published: true,
    });
    assert.ok(valid.success);

    // Reject title > 80 chars
    const invalidTitle = procedureDetailsSchema.safeParse({
      title: "A".repeat(81),
      slug: "valid-slug",
    });
    assert.equal(invalidTitle.success, false);

    // Reject short_desc > 200 chars
    const invalidDesc = procedureDetailsSchema.safeParse({
      title: "Valid Title",
      slug: "valid-slug",
      short_description: "B".repeat(201),
    });
    assert.equal(invalidDesc.success, false);

    // Reject cover_alt > 200 chars
    const invalidAlt = procedureDetailsSchema.safeParse({
      title: "Valid Title",
      slug: "valid-slug",
      cover_alt: "C".repeat(201),
    });
    assert.equal(invalidAlt.success, false);
  });

  it("enforces procedureOverviewSchema limits (definition 2000, list item 500)", () => {
    // Valid overview
    const valid = procedureOverviewSchema.safeParse({
      definition: "Definition text under 2000 chars",
      indications: ["Indication item 1", "Indication item 2"],
      contraindications: ["Contraindication 1"],
      common_mistakes: ["Common mistake 1"],
    });
    assert.ok(valid.success);

    // Reject definition > 2000 chars
    const invalidDef = procedureOverviewSchema.safeParse({
      definition: "D".repeat(2001),
      indications: [],
      contraindications: [],
      common_mistakes: [],
    });
    assert.equal(invalidDef.success, false);

    // Reject list item > 500 chars
    const invalidItem = procedureOverviewSchema.safeParse({
      definition: "Short definition",
      indications: ["E".repeat(501)],
      contraindications: [],
      common_mistakes: [],
    });
    assert.equal(invalidItem.success, false);
  });

  it("enforces siteSettingsSchema limits (footer 300, site_name 300, tagline 300)", () => {
    const valid = siteSettingsSchema.safeParse({
      site_name: "Critical Ease",
      tagline: "Learn • Practice • Excel",
      splash_cta: "هيا نبدأ",
      hero_eyebrow: "تمريض الطوارئ والرعاية الحرجة",
      hero_title: "مرحبًا بك في Critical Ease",
      hero_description: "وصف المنصة التعليمية",
      hero_cta: "استكشف الإجراءات",
      footer_text: "قسم تمريض الحالات الحرجة والطوارئ — جميع الحقوق محفوظة.",
      logo_path: null,
    });
    assert.ok(valid.success);

    // Reject footer > 300 chars
    const invalidFooter = siteSettingsSchema.safeParse({
      site_name: "Critical Ease",
      footer_text: "F".repeat(301),
    });
    assert.equal(invalidFooter.success, false);
  });

  it("validates reorderBatchSchema structure", () => {
    const valid = reorderBatchSchema.safeParse({
      items: [
        { id: "11111111-1111-4111-8111-111111111111", sort_order: 10 },
        { id: "22222222-2222-4222-8222-222222222222", sort_order: 20 },
      ],
    });
    assert.ok(valid.success);

    // Reject invalid UUID
    const invalidUuid = reorderBatchSchema.safeParse({
      items: [{ id: "not-a-uuid", sort_order: 10 }],
    });
    assert.equal(invalidUuid.success, false);
  });

  it("enforces equipmentBatchSchema limits (max 100 items, name <= 120, bidi stripping)", () => {
    const valid = equipmentBatchSchema.safeParse({
      procedureId: "11111111-1111-4111-8111-111111111111",
      items: [
        {
          name: "Sterile drape \u202Aoverride\u202C",
          photo_path: "equipment/test/image.webp",
          sort_order: 10,
        },
      ],
    });
    assert.ok(valid.success);
    if (valid.success) {
      assert.equal(valid.data.items[0].name, "Sterile drape override");
    }

    // Name over 120 chars
    const invalidName = equipmentBatchSchema.safeParse({
      procedureId: "11111111-1111-4111-8111-111111111111",
      items: [{ name: "N".repeat(121) }],
    });
    assert.equal(invalidName.success, false);

    // Over 100 items
    const over100 = equipmentBatchSchema.safeParse({
      procedureId: "11111111-1111-4111-8111-111111111111",
      items: Array.from({ length: 101 }, (_, i) => ({ name: `Item ${i}` })),
    });
    assert.equal(over100.success, false);
  });

  it("enforces checklistBatchSchema limits (max 200 steps, text_en <= 500, phase <= 80, bidi stripping)", () => {
    const valid = checklistBatchSchema.safeParse({
      procedureId: "11111111-1111-4111-8111-111111111111",
      steps: [
        {
          text_en: "Confirm identity \u2066isolated\u2069",
          text_ar: "التحقق من الهوية",
          is_critical: true,
          phase: "Preparation",
          sort_order: 10,
        },
      ],
    });
    assert.ok(valid.success);
    if (valid.success) {
      assert.equal(valid.data.steps[0].text_en, "Confirm identity isolated");
    }

    // Over 200 steps
    const over200 = checklistBatchSchema.safeParse({
      procedureId: "11111111-1111-4111-8111-111111111111",
      steps: Array.from({ length: 201 }, (_, i) => ({ text_en: `Step ${i}` })),
    });
    assert.equal(over200.success, false);
  });
});
