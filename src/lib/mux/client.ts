import Mux from "@mux/mux-node";
import crypto from "crypto";

/**
 * Returns whether all required Mux credentials are present.
 * If any core key is missing, Mux operations must never be invoked.
 */
export function isMuxConfigured(): boolean {
  return !!(
    process.env.MUX_TOKEN_ID &&
    process.env.MUX_TOKEN_SECRET &&
    process.env.MUX_SIGNING_KEY_ID &&
    process.env.MUX_SIGNING_PRIVATE_KEY
  );
}

/**
 * Returns whether demo mode is currently enforced.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true";
}

let muxClientInstance: Mux | null = null;

export function getMuxClient(): Mux {
  if (!isMuxConfigured()) {
    throw new Error("Mux is not configured: Missing required environment variables.");
  }
  if (!muxClientInstance) {
    muxClientInstance = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
  }
  return muxClientInstance;
}

/**
 * Normalizes the base64-encoded or raw PEM private key for Mux RS256 token signing.
 */
function getNormalizedSigningKey(): string {
  const raw = process.env.MUX_SIGNING_PRIVATE_KEY || "";
  if (raw.includes("BEGIN") && raw.includes("PRIVATE KEY")) {
    return raw;
  }
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    if (decoded.includes("BEGIN") && decoded.includes("PRIVATE KEY")) {
      return decoded;
    }
  } catch {
    // fallback to raw
  }
  return raw;
}

/**
 * Creates a direct upload URL for client-side chunked upload via @mux/upchunk.
 * Enforces signed playback policy and prohibits MP4 renditions.
 */
export async function createMuxDirectUpload(procedureId: string, origin?: string) {
  const mux = getMuxClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const corsOrigin =
    siteUrl ||
    (origin && origin !== "*" ? origin : undefined) ||
    process.env.MUX_CORS_ORIGIN ||
    "*";

  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ["signed"],
      passthrough: procedureId,
      mp4_support: "none",
    },
    cors_origin: corsOrigin,
  });

  return {
    uploadId: upload.id,
    uploadUrl: upload.url,
    status: upload.status,
  };
}

/**
 * Retrieves direct upload status and associated asset ID (if processing/completed).
 */
export async function getMuxUpload(uploadId: string) {
  const mux = getMuxClient();
  return await mux.video.uploads.retrieve(uploadId);
}

/**
 * Retrieves asset details (playback_ids, status, duration, errors).
 */
export async function getMuxAsset(assetId: string) {
  const mux = getMuxClient();
  return await mux.video.assets.retrieve(assetId);
}

/**
 * Deletes an asset from Mux.
 * Explicitly reports failure to the caller so errors are not swallowed.
 */
export async function deleteMuxAsset(assetId: string): Promise<void> {
  const mux = getMuxClient();
  try {
    await mux.video.assets.delete(assetId);
  } catch (err: any) {
    // If the asset already does not exist (404), consider it cleaned up
    if (err?.status === 404 || err?.statusCode === 404) {
      return;
    }
    const message = err?.message || String(err);
    throw new Error(`فشل حذف ملف الفيديو من خوادم Mux (${assetId}): ${message}`);
  }
}

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === "string" ? Buffer.from(str) : str;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export interface MuxSignedTokenResult {
  token: string;
  header: {
    alg: string;
    typ: string;
    kid: string;
  };
  claims: {
    sub: string;
    aud: string;
    exp: number;
  };
}

/**
 * Generates an RS256 signed playback token for a Mux playback ID.
 * Defaults to 1 hour validity (3600 seconds).
 * Explicitly includes `kid` in the JWT Header as strictly required by Mux video infrastructure.
 */
export async function generateMuxPlaybackToken(
  playbackId: string,
  durationSeconds = 3600
): Promise<MuxSignedTokenResult> {
  if (!isMuxConfigured()) {
    throw new Error("Mux is not configured: Missing signing keys.");
  }

  const keyId = process.env.MUX_SIGNING_KEY_ID!;
  const keySecret = getNormalizedSigningKey();

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: keyId,
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + durationSeconds;

  const claims = {
    sub: playbackId,
    aud: "v",
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(keySecret);
  const encodedSignature = base64UrlEncode(signature);

  const token = `${signingInput}.${encodedSignature}`;

  return { token, header, claims };
}

/**
 * Lists all existing assets in Mux to identify live usage and detect orphan assets.
 */
export async function listAllMuxAssets(): Promise<Array<{ id: string; status: string; passthrough?: string }>> {
  if (!isMuxConfigured()) {
    return [];
  }
  const mux = getMuxClient();
  const result: Array<{ id: string; status: string; passthrough?: string }> = [];

  let page = await mux.video.assets.list({ limit: 25 });
  for (const asset of page.data) {
    result.push({
      id: asset.id,
      status: asset.status,
      passthrough: asset.passthrough,
    });
  }

  return result;
}

/**
 * Verifies a Mux webhook request signature using MUX_WEBHOOK_SECRET.
 */
export async function verifyMuxWebhook(
  rawBody: string,
  headers: Headers | Record<string, string | string[] | undefined>
): Promise<any> {
  if (!process.env.MUX_WEBHOOK_SECRET) {
    throw new Error("MUX_WEBHOOK_SECRET is not configured.");
  }
  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID || "dummy",
    tokenSecret: process.env.MUX_TOKEN_SECRET || "dummy",
  });
  return await mux.webhooks.unwrap(rawBody, headers as any, process.env.MUX_WEBHOOK_SECRET);
}
