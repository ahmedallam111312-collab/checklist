import { describe, it } from "node:test";
import assert from "node:assert";
import { withIdempotency } from "@/lib/idempotency";

describe("Idempotency Service", () => {
  it("executes handler directly when idempotencyKey is not provided", async () => {
    let callCount = 0;
    const handler = async () => {
      callCount++;
      return { success: true, count: callCount };
    };

    const res1 = await withIdempotency(undefined, "user1", "test_action", handler);
    const res2 = await withIdempotency(undefined, "user1", "test_action", handler);

    assert.strictEqual(res1.count, 1);
    assert.strictEqual(res2.count, 2);
    assert.strictEqual(callCount, 2);
  });

  it("caches and returns the exact same result when called with the same idempotencyKey", async () => {
    let callCount = 0;
    const key = `key-test-${Date.now()}`;
    const handler = async () => {
      callCount++;
      return { success: true, callCount, uniqueToken: "abc-123" };
    };

    const res1 = await withIdempotency(key, "user1", "create_asset", handler);
    const res2 = await withIdempotency(key, "user1", "create_asset", handler);

    assert.strictEqual(callCount, 1);
    assert.deepStrictEqual(res1, res2);
    assert.strictEqual(res2.uniqueToken, "abc-123");
  });

  it("distinguishes between different actions or different users with the same key", async () => {
    let callCount = 0;
    const key = `shared-key-${Date.now()}`;
    const handler = async () => {
      callCount++;
      return { run: callCount };
    };

    const res1 = await withIdempotency(key, "user1", "action_A", handler);
    const res2 = await withIdempotency(key, "user2", "action_A", handler);
    const res3 = await withIdempotency(key, "user1", "action_B", handler);

    assert.strictEqual(callCount, 3);
    assert.strictEqual(res1.run, 1);
    assert.strictEqual(res2.run, 2);
    assert.strictEqual(res3.run, 3);
  });

  it("deduplicates concurrent double-click invocations before first promise settles", async () => {
    let callCount = 0;
    const key = `concurrent-key-${Date.now()}`;
    const slowHandler = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 25));
      return { createdId: `proc-${callCount}` };
    };

    const [a, b] = await Promise.all([
      withIdempotency(key, "user1", "create_procedure", slowHandler),
      withIdempotency(key, "user1", "create_procedure", slowHandler),
    ]);

    assert.strictEqual(callCount, 1);
    assert.deepStrictEqual(a, b);
    assert.strictEqual(a.createdId, "proc-1");
  });
});
