import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractProjectRef, assertTestDataSafety } from "../helpers/test-data-safety";

describe("T1 Test Data Safety Guard & Project Ref Extraction", () => {
  it("extracts the project ref from standard Supabase URL", () => {
    assert.equal(
      extractProjectRef("https://abcdefghijklmnopqrst.supabase.co"),
      "abcdefghijklmnopqrst"
    );
    assert.equal(
      extractProjectRef("https://test-ref-123.supabase.co/rest/v1"),
      "test-ref-123"
    );
  });

  it("returns empty string for invalid URLs", () => {
    assert.equal(extractProjectRef("invalid-url"), "");
    assert.equal(extractProjectRef(""), "");
  });

  it("throws safety violation error when .env.test is missing", () => {
    assert.throws(
      () => {
        assertTestDataSafety();
      },
      (err: any) => {
        return err.message.includes("TEST DATA SAFETY VIOLATION") &&
               err.message.includes(".env.test file is missing");
      }
    );
  });
});
