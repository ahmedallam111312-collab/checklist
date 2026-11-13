import { test, describe } from "node:test";
import assert from "node:assert";
import { getPublicImageUrl } from "../../src/lib/images/url";

describe("Public Image URL Resolver", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;

  test("returns null for null, undefined, or empty path", () => {
    assert.strictEqual(getPublicImageUrl(null), null);
    assert.strictEqual(getPublicImageUrl(undefined), null);
    assert.strictEqual(getPublicImageUrl(""), null);
    assert.strictEqual(getPublicImageUrl("   "), null);
  });

  test("preserves absolute HTTP/HTTPS URLs", () => {
    const url = "https://images.example.com/photo.jpg";
    assert.strictEqual(getPublicImageUrl(url), url);
  });

  test("preserves data and blob URLs", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo";
    const blobUrl = "blob:http://localhost:3000/uuid-1234";
    assert.strictEqual(getPublicImageUrl(dataUrl), dataUrl);
    assert.strictEqual(getPublicImageUrl(blobUrl), blobUrl);
  });

  test("preserves root-relative static asset paths", () => {
    assert.strictEqual(getPublicImageUrl("/brand/logo.png"), "/brand/logo.png");
    assert.strictEqual(getPublicImageUrl("/icons/icon.png"), "/icons/icon.png");
  });

  test("resolves relative storage paths against Supabase site-images bucket", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
    const resolved = getPublicImageUrl("covers/general/photo-123.webp");
    assert.strictEqual(
      resolved,
      "https://test-project.supabase.co/storage/v1/object/public/site-images/covers/general/photo-123.webp"
    );

    // Strips leading slashes if present
    const resolved2 = getPublicImageUrl("equipment/syringe.webp");
    assert.strictEqual(
      resolved2,
      "https://test-project.supabase.co/storage/v1/object/public/site-images/equipment/syringe.webp"
    );

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
  });
});
