import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractProjectRef,
  compareDevFingerprints,
  assertDevUnchanged,
  DevFingerprint,
  DEV_PROJECT_REF,
} from "../support/dev-fingerprint";

describe("R3 / K2 DEV Database Protection & Fingerprint Comparator", () => {
  const baseFingerprint: DevFingerprint = {
    projectRef: DEV_PROJECT_REF,
    timestamp: "2026-11-09T13:00:00.000Z",
    counts: {
      procedures: 5,
      checklist_steps: 0,
      equipment_items: 0,
      list_items: 0,
      site_settings: 1,
      admins: 1,
      storage_objects: 0,
      e2e_procedures: 0,
    },
    maxUpdatedAt: {
      procedures: "2026-11-09T10:46:41.175829+00:00",
      site_settings: "2026-11-07T08:58:07.905344+00:00",
    },
  };

  it("extracts Supabase project ref accurately", () => {
    assert.equal(
      extractProjectRef("https://smfsmixdymphtgfalupl.supabase.co"),
      "smfsmixdymphtgfalupl"
    );
    assert.equal(
      extractProjectRef("https://test-ref.supabase.co/rest/v1"),
      "test-ref"
    );
    assert.equal(extractProjectRef("invalid"), "");
  });

  it("identifies matching fingerprints as identical", () => {
    const clone = JSON.parse(JSON.stringify(baseFingerprint));
    const result = compareDevFingerprints(baseFingerprint, clone);
    assert.equal(result.matches, true);
    assert.equal(result.diffs.length, 0);
    assert.doesNotThrow(() => assertDevUnchanged(baseFingerprint, clone));
  });

  it("detects procedure row count mutation and triggers violation", () => {
    const mutated = JSON.parse(JSON.stringify(baseFingerprint));
    mutated.counts.procedures = 6;

    const result = compareDevFingerprints(baseFingerprint, mutated);
    assert.equal(result.matches, false);
    assert.ok(result.diffs.some((d) => d.includes("Table 'procedures' count changed")));
    assert.throws(() => assertDevUnchanged(baseFingerprint, mutated), /DEV INTEGRITY VIOLATION/);
  });

  it("detects checklist_steps row count mutation", () => {
    const mutated = JSON.parse(JSON.stringify(baseFingerprint));
    mutated.counts.checklist_steps = 1;

    const result = compareDevFingerprints(baseFingerprint, mutated);
    assert.equal(result.matches, false);
    assert.ok(result.diffs.some((d) => d.includes("Table 'checklist_steps' count changed")));
    assert.throws(() => assertDevUnchanged(baseFingerprint, mutated), /checklist_steps/);
  });

  it("detects equipment_items and list_items mutations", () => {
    const mutated = JSON.parse(JSON.stringify(baseFingerprint));
    mutated.counts.equipment_items = 2;
    mutated.counts.list_items = 3;

    const result = compareDevFingerprints(baseFingerprint, mutated);
    assert.equal(result.matches, false);
    assert.equal(result.diffs.length, 2);
  });

  it("detects storage.objects mutation", () => {
    const mutated = JSON.parse(JSON.stringify(baseFingerprint));
    mutated.counts.storage_objects = 1;

    const result = compareDevFingerprints(baseFingerprint, mutated);
    assert.equal(result.matches, false);
    assert.ok(result.diffs.some((d) => d.includes("Table 'storage_objects' count changed")));
  });

  it("detects appearance of e2e-% procedures as a critical violation", () => {
    const mutated = JSON.parse(JSON.stringify(baseFingerprint));
    mutated.counts.e2e_procedures = 1;

    const result = compareDevFingerprints(baseFingerprint, mutated);
    assert.equal(result.matches, false);
    assert.ok(result.diffs.some((d) => d.includes("CRITICAL: 1 'e2e-%' procedure(s) detected in DEV project")));
    assert.throws(() => assertDevUnchanged(baseFingerprint, mutated), /e2e-%/);
  });

  it("detects procedures max(updated_at) timestamp mutation", () => {
    const mutated = JSON.parse(JSON.stringify(baseFingerprint));
    mutated.maxUpdatedAt.procedures = "2026-11-09T13:30:00.000000+00:00";

    const result = compareDevFingerprints(baseFingerprint, mutated);
    assert.equal(result.matches, false);
    assert.ok(result.diffs.some((d) => d.includes("procedures max(updated_at) changed")));
    assert.throws(() => assertDevUnchanged(baseFingerprint, mutated), /max\(updated_at\)/);
  });

  it("detects site_settings max(updated_at) timestamp mutation", () => {
    const mutated = JSON.parse(JSON.stringify(baseFingerprint));
    mutated.maxUpdatedAt.site_settings = "2026-11-09T13:30:00.000000+00:00";

    const result = compareDevFingerprints(baseFingerprint, mutated);
    assert.equal(result.matches, false);
    assert.ok(result.diffs.some((d) => d.includes("site_settings max(updated_at) changed")));
    assert.throws(() => assertDevUnchanged(baseFingerprint, mutated), /site_settings max\(updated_at\)/);
  });
});
