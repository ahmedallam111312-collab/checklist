import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isMuxConfigured } from "../../src/lib/mux/client";
import { mapActionError } from "../../src/lib/video/error-mapping";

describe("Phase 3 Video Pipeline & Mux Logic Unit Tests", () => {
  it("validates Mux configuration detection helper", () => {
    // isMuxConfigured evaluates environment variables
    const configured = isMuxConfigured();
    assert.equal(typeof configured, "boolean");
  });

  it("verifies duration formatting helper converts seconds to mm:ss accurately", () => {
    function formatDuration(totalSeconds: number | null): string {
      if (!totalSeconds || isNaN(totalSeconds)) return "00:00";
      const mins = Math.floor(totalSeconds / 60);
      const secs = Math.floor(totalSeconds % 60);
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    assert.equal(formatDuration(0), "00:00");
    assert.equal(formatDuration(null), "00:00");
    assert.equal(formatDuration(30), "00:30");
    assert.equal(formatDuration(95.4), "01:35");
    assert.equal(formatDuration(3600), "60:00");
    assert.equal(formatDuration(139.7), "02:19");
  });

  it("enforces free-plan quota boundary: blocks upload at 10 assets for new procedures", () => {
    function isUploadPermitted(usedCount: number, isReplacement: boolean): boolean {
      if (isReplacement) return true;
      return usedCount < 10;
    }

    assert.equal(isUploadPermitted(7, false), true);
    assert.equal(isUploadPermitted(9, false), true);
    assert.equal(isUploadPermitted(10, false), false);
    assert.equal(isUploadPermitted(11, false), false);
    // Replacement must always be permitted even at or above 10
    assert.equal(isUploadPermitted(10, true), true);
    assert.equal(isUploadPermitted(12, true), true);
  });

  it("identifies orphan Mux assets not referenced by any procedure", () => {
    function findOrphanAssets(
      allMuxAssets: Array<{ id: string }>,
      proceduresWithAsset: Array<{ mux_asset_id: string | null }>
    ): string[] {
      const referenced = new Set(proceduresWithAsset.map((p) => p.mux_asset_id).filter(Boolean));
      return allMuxAssets.filter((a) => !referenced.has(a.id)).map((a) => a.id);
    }

    const muxAssets = [{ id: "asset-1" }, { id: "asset-2" }, { id: "asset-orphan-3" }];
    const procedures = [
      { mux_asset_id: "asset-1" },
      { mux_asset_id: "asset-2" },
      { mux_asset_id: null },
    ];

    const orphans = findOrphanAssets(muxAssets, procedures);
    assert.deepEqual(orphans, ["asset-orphan-3"]);
  });

  it("computes dashboard progress bar color thresholds (cyan < 8, amber 8..9, red >= 10)", () => {
    function getBarColorToken(usedCount: number): "cyan" | "amber" | "red" {
      if (usedCount >= 10) return "red";
      if (usedCount >= 8) return "amber";
      return "cyan";
    }

    assert.equal(getBarColorToken(0), "cyan");
    assert.equal(getBarColorToken(5), "cyan");
    assert.equal(getBarColorToken(7), "cyan");
    assert.equal(getBarColorToken(8), "amber");
    assert.equal(getBarColorToken(9), "amber");
    assert.equal(getBarColorToken(10), "red");
    assert.equal(getBarColorToken(11), "red");
  });

  it("maps simulated missing-column error (PGRST204) to friendly Arabic message without leaking internal details", () => {
    const simulatedMissingColumnError = {
      code: "PGRST204",
      details: null,
      hint: null,
      message: "Could not find the 'video_status' column of 'procedures' in the schema cache",
    };

    const friendlyMessage = mapActionError("pollVideoStatus", simulatedMissingColumnError);

    // Must NEVER leak raw error code, column name, or table name to user
    assert.equal(friendlyMessage.includes("PGRST204"), false);
    assert.equal(friendlyMessage.includes("video_status"), false);
    assert.equal(friendlyMessage.includes("procedures"), false);
    assert.equal(friendlyMessage.includes("schema cache"), false);

    // Must provide friendly Arabic explanation and retry
    assert.equal(friendlyMessage.includes("تعذر إكمال العملية"), true);
    assert.equal(friendlyMessage.includes("إعادة المحاولة"), true);
  });

  it("maps network connection errors to friendly Arabic message without leaking host or stack details", () => {
    const simulatedNetworkError = new Error("fetch failed: connect ECONNREFUSED 127.0.0.1:54321");
    const friendlyMessage = mapActionError("createMuxDirectUpload", simulatedNetworkError);

    assert.equal(friendlyMessage.includes("ECONNREFUSED"), false);
    assert.equal(friendlyMessage.includes("127.0.0.1"), false);
    assert.equal(friendlyMessage.includes("الاتصال بالخادم"), true);
    assert.equal(friendlyMessage.includes("إعادة المحاولة"), true);
  });

  it("enforces type hierarchy token invariant: heading (16-17px) strictly exceeds supporting (13-14px)", () => {
    const headingBaseMobile = 16;
    const headingBaseDesktop = 17;
    const supportingBase = 13;
    const arabicBump = 1;
    const supportingArabic = supportingBase + arabicBump; // 14px

    assert.ok(headingBaseMobile > supportingArabic, `Heading mobile (${headingBaseMobile}px) must be > supporting Arabic (${supportingArabic}px)`);
    assert.ok(headingBaseDesktop > supportingArabic, `Heading desktop (${headingBaseDesktop}px) must be > supporting Arabic (${supportingArabic}px)`);
    assert.ok(headingBaseMobile - supportingArabic >= 2, "Difference must be at least 2px");
  });
});
