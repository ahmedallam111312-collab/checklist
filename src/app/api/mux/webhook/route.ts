import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { verifyMuxWebhook } from "@/lib/mux/client";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body." }, { status: 400 });
  }

  // 1. Verify Mux Webhook Signature
  let event: any;
  try {
    // Collect all headers into a plain record for verification
    const headersRecord: Record<string, string> = {};
    request.headers.forEach((val, key) => {
      headersRecord[key.toLowerCase()] = val;
    });

    event = await verifyMuxWebhook(rawBody, headersRecord);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  if (!event || !event.type) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const { type, data } = event;
  const procedureId = data?.passthrough;

  if (!procedureId) {
    // If not associated with a procedure passthrough, acknowledge receipt idempotently
    return NextResponse.json({ received: true, note: "Ignored (no passthrough procedure id)" });
  }

  // 2. Initialize server client for webhook ingestion if secret key is available in environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey) {
    // In local dev without secret key or tunnel, webhook safely returns 200; admin polling handles updates
    return NextResponse.json({
      received: true,
      note: "Acknowledged. Database update delegated to admin polling.",
    });
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceKey);

  try {
    if (type === "video.asset.ready") {
      const signedPlayback = data.playback_ids?.find((p: any) => p.policy === "signed");
      const playbackId = signedPlayback?.id || data.playback_ids?.[0]?.id || null;
      const duration = data.duration ? Math.round(data.duration * 100) / 100 : null;

      await supabase
        .from("procedures")
        .update({
          video_status: "ready",
          mux_asset_id: data.id,
          mux_playback_id: playbackId,
          video_duration_seconds: duration,
          video_error: null,
          video_updated_at: new Date().toISOString(),
        })
        .eq("id", procedureId);
    } else if (type === "video.asset.errored") {
      const errorMsg = data.errors?.messages?.[0] || "فشلت معالجة الفيديو في Mux.";
      await supabase
        .from("procedures")
        .update({
          video_status: "errored",
          video_error: errorMsg,
          video_updated_at: new Date().toISOString(),
        })
        .eq("id", procedureId);
    } else if (type === "video.upload.asset_created") {
      // Out-of-order tolerance: If video is already marked ready (e.g. video.asset.ready arrived first),
      // do not regress video_status back to processing.
      const { data: current } = await supabase
        .from("procedures")
        .select("video_status")
        .eq("id", procedureId)
        .single();

      if (current?.video_status !== "ready") {
        await supabase
          .from("procedures")
          .update({
            video_status: "processing",
            mux_asset_id: data.asset_id,
            video_updated_at: new Date().toISOString(),
          })
          .eq("id", procedureId);
      }
    }

    try {
      revalidatePath("/procedures");
      revalidatePath("/admin");
    } catch {
      // safe in edge context
    }

    return NextResponse.json({ received: true, event: type, procedureId });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Database update failed: ${err.message}` },
      { status: 500 }
    );
  }
}
