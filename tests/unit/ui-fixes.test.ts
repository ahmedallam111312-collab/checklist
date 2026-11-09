import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatArabicPlural, AR_STRINGS } from "../../src/messages/ar";

describe("T9 UI Polish & Arabic Pluralization Unit Tests", () => {
  it("T9(a): backup note contains 'تتضمن' instead of 'تضمن'", () => {
    assert.match(AR_STRINGS.backupNote, /تتضمن/);
    assert.doesNotMatch(AR_STRINGS.backupNote, /^تضمن\s/);
  });

  it("T9(e): formats Arabic plural rules accurately across all numerical classes", () => {
    const procedurePlural = (count: number) =>
      formatArabicPlural(count, {
        zero: "إجراء سريري",
        one: "إجراء سريري واحد",
        two: "إجراءان سريريان",
        few: "إجراءات سريرية",
        many: "إجراءً سريريًا",
        other: "إجراء سريري",
      });

    assert.equal(procedurePlural(0), "إجراء سريري");
    assert.equal(procedurePlural(1), "إجراء سريري واحد");
    assert.equal(procedurePlural(2), "إجراءان سريريان");
    assert.equal(procedurePlural(3), "إجراءات سريرية");
    assert.equal(procedurePlural(5), "إجراءات سريرية");
    assert.equal(procedurePlural(10), "إجراءات سريرية");
    assert.equal(procedurePlural(11), "إجراءً سريريًا");
    assert.equal(procedurePlural(25), "إجراءً سريريًا");
    assert.equal(procedurePlural(100), "إجراء سريري");
  });

  it("T9(f): hasArabicText helper correctly detects empty or missing Arabic translation", () => {
    const hasArabicText = (text_ar?: string | null) =>
      Boolean(text_ar && text_ar.trim().length > 0);

    assert.equal(hasArabicText(null), false);
    assert.equal(hasArabicText(undefined), false);
    assert.equal(hasArabicText(""), false);
    assert.equal(hasArabicText("   "), false);
    assert.equal(hasArabicText("ترجمة عربية"), true);
  });
});
