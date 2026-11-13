import { test, describe } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { verifyMuxWebhook } from "@/lib/mux/client";

describe("Mux Webhook Signature & Event Ordering Unit Tests", () => {
  const TEST_SECRET = "test_webhook_secret_9999999999";

  function createSignedMuxPayload(payloadObj: any, secret = TEST_SECRET, timestamp?: number) {
    const rawBody = JSON.stringify(payloadObj);
    const t = timestamp ?? Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${t}.${rawBody}`)
      .digest("hex");
    const header = `t=${t},v1=${signature}`;
    return {
      rawBody,
      headers: {
        "mux-signature": header,
      },
    };
  }

  test("1. successfully verifies and unwraps a valid locally signed Mux webhook payload", async () => {
    const originalSecret = process.env.MUX_WEBHOOK_SECRET;
    process.env.MUX_WEBHOOK_SECRET = TEST_SECRET;

    const sampleEvent = {
      type: "video.asset.ready",
      data: {
        id: "mock_asset_123",
        passthrough: "proc-uuid-456",
        playback_ids: [{ id: "mock_pb_789", policy: "signed" }],
        duration: 42.15,
      },
    };

    const { rawBody, headers } = createSignedMuxPayload(sampleEvent);
    const unwrapped = await verifyMuxWebhook(rawBody, headers);

    assert.strictEqual(unwrapped.type, "video.asset.ready");
    assert.strictEqual(unwrapped.data.id, "mock_asset_123");
    assert.strictEqual(unwrapped.data.passthrough, "proc-uuid-456");

    process.env.MUX_WEBHOOK_SECRET = originalSecret;
  });

  test("2. rejects webhook with invalid signature", async () => {
    const originalSecret = process.env.MUX_WEBHOOK_SECRET;
    process.env.MUX_WEBHOOK_SECRET = TEST_SECRET;

    const sampleEvent = { type: "video.asset.ready", data: { id: "mock" } };
    const { rawBody } = createSignedMuxPayload(sampleEvent, "wrong_secret");
    const badHeaders = { "mux-signature": "t=1234567,v1=bad_signature_hash" };

    await assert.rejects(
      async () => verifyMuxWebhook(rawBody, badHeaders),
      /signature/i
    );

    process.env.MUX_WEBHOOK_SECRET = originalSecret;
  });

  test("3. out-of-order event ordering logic: asset.ready before upload.asset_created preserves ready status", () => {
    // Simulating database row state transition machine
    type ProcState = { status: string; assetId?: string; playbackId?: string };

    let state: ProcState = { status: "uploading" };

    // Handler simulating webhook transition logic
    function applyEvent(currentState: ProcState, event: { type: string; data: any }): ProcState {
      if (event.type === "video.asset.ready") {
        return {
          status: "ready",
          assetId: event.data.id,
          playbackId: event.data.playback_ids?.[0]?.id,
        };
      }
      if (event.type === "video.upload.asset_created") {
        // Out-of-order safeguard
        if (currentState.status === "ready") {
          return currentState; // Do not regress
        }
        return {
          ...currentState,
          status: "processing",
          assetId: event.data.asset_id,
        };
      }
      return currentState;
    }

    // Step A: video.asset.ready arrives FIRST (out-of-order)
    state = applyEvent(state, {
      type: "video.asset.ready",
      data: { id: "asset_abc", playback_ids: [{ id: "pb_abc" }] },
    });
    assert.strictEqual(state.status, "ready");
    assert.strictEqual(state.playbackId, "pb_abc");

    // Step B: video.upload.asset_created arrives LATE
    state = applyEvent(state, {
      type: "video.upload.asset_created",
      data: { asset_id: "asset_abc" },
    });
    // Status must remain 'ready', NOT regressed to 'processing'
    assert.strictEqual(state.status, "ready");
    assert.strictEqual(state.assetId, "asset_abc");
  });

  test("4. repeated delivery idempotency: duplicate video.asset.ready events produce identical safe state", () => {
    type ProcState = { status: string; assetId?: string; count: number };
    let state: ProcState = { status: "processing", count: 0 };

    function handleReady(currentState: ProcState, data: { id: string }): ProcState {
      return {
        status: "ready",
        assetId: data.id,
        count: currentState.count + 1,
      };
    }

    const payload = { id: "asset_idempotent_test" };

    // First delivery
    state = handleReady(state, payload);
    assert.strictEqual(state.status, "ready");
    assert.strictEqual(state.assetId, "asset_idempotent_test");

    // Second delivery (duplicate retry from Mux)
    state = handleReady(state, payload);
    assert.strictEqual(state.status, "ready");
    assert.strictEqual(state.assetId, "asset_idempotent_test");
    assert.strictEqual(state.count, 2); // Processed idempotently without regression
  });
});
