import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateRawImage } from "../../src/lib/images/resizer";

describe("Image Upload Validation & 5 MB Pre-Upload Sizing Rules (10f)", () => {
  it("accepts a ~4.9 MB PNG image for client-side processing", () => {
    // 4.9 MB = 4.9 * 1024 * 1024 = 5,138,022 bytes (< 5 MB limit)
    const size4_9MB = Math.floor(4.9 * 1024 * 1024);
    const mockFile = {
      name: "camera-shot.png",
      type: "image/png",
      size: size4_9MB,
    } as File;

    const validation = validateRawImage(mockFile);
    assert.equal(validation.valid, true);
    assert.equal(validation.error, undefined);
  });

  it("rejects an image over 5 MB with an Arabic error message", () => {
    // 5.1 MB = 5.1 * 1024 * 1024 = 5,347,737 bytes (> 5 MB limit)
    const size5_1MB = Math.floor(5.1 * 1024 * 1024);
    const mockFile = {
      name: "oversized-raw.jpg",
      type: "image/jpeg",
      size: size5_1MB,
    } as File;

    const validation = validateRawImage(mockFile);
    assert.equal(validation.valid, false);
    assert.ok(validation.error?.includes("5 ميجابايت"));
    assert.ok(validation.error?.includes("حجم الصورة كبير جدًا"));
  });

  it("rejects unsupported MIME types with Arabic message", () => {
    const mockFile = {
      name: "document.pdf",
      type: "application/pdf",
      size: 1024 * 100,
    } as File;

    const validation = validateRawImage(mockFile);
    assert.equal(validation.valid, false);
    assert.ok(validation.error?.includes("نوع الملف غير مدعوم"));
  });
});
