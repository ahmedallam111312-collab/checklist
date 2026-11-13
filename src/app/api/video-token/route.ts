import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/auth/admin";
import { isDemoMode } from "@/lib/data";
import { generateMuxPlaybackToken, isMuxConfigured } from "@/lib/mux/client";
import { DEMO_PROCEDURES } from "@/data/demo-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");

  if (!slug && !id) {
    console.log(
      JSON.stringify({
        route: "/api/video-token",
        status: 400,
        isAdmin: false,
        error: "Missing procedure slug or id parameter.",
      })
    );
    return NextResponse.json(
      { error: "Missing procedure slug or id parameter." },
      { status: 400 }
    );
  }

  // 1. In Demo Mode, simulate ready token for demo procedures if requested
  if (isDemoMode()) {
    const demoProc = DEMO_PROCEDURES.find(
      (p) => (slug && p.slug === slug) || (id && p.id === id)
    );
    if (!demoProc) {
      return NextResponse.json({ error: "Procedure not found." }, { status: 404 });
    }
    if (!demoProc.published) {
      const auth = await verifyAdmin();
      if (!auth.authorized) {
        return NextResponse.json(
          { error: "Unauthorized: Procedure is unpublished." },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      {
        token: "demo-token",
        playbackId: demoProc.mux_playback_id || "demo-playback-id",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  // 2. Real Supabase Procedure Query
  try {
    const supabase = await createClient();

    let query = supabase
      .from("procedures")
      .select("id, slug, published, mux_playback_id, video_status");

    if (id) {
      query = query.eq("id", id);
    } else if (slug) {
      query = query.eq("slug", slug);
    }

    let { data: proc, error: procErr } = await query.single();

    // If not found via anon client, check if it's an existing draft to return a clear 403 Forbidden
    if (procErr || !proc) {
      const secretKey = process.env.SUPABASE_SECRET_KEY;
      if (secretKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const adminSupabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, secretKey);
        let draftQuery = adminSupabase.from("procedures").select("id, slug, published, mux_playback_id, video_status");
        if (id) draftQuery = draftQuery.eq("id", id);
        else if (slug) draftQuery = draftQuery.eq("slug", slug);
        const { data: draftProc } = await draftQuery.single();

        if (draftProc && !draftProc.published) {
          const auth = await verifyAdmin();
          if (!auth.authorized) {
            return NextResponse.json(
              { error: "Forbidden: Anonymous access to unpublished procedure video token is rejected." },
              { status: 403 }
            );
          }
          proc = draftProc;
        }
      }
    }

    if (!proc) {
      console.log(
        JSON.stringify({
          route: "/api/video-token",
          status: 404,
          isAdmin: false,
          error: "Procedure not found or inaccessible.",
        })
      );
      return NextResponse.json(
        { error: "Procedure not found or inaccessible." },
        { status: 404 }
      );
    }

    // 3. Draft Authorization Guard:
    // If unpublished, ONLY an authenticated admin session is permitted (for draft preview)
    if (!proc.published) {
      const auth = await verifyAdmin();
      if (!auth.authorized) {
        console.log(
          JSON.stringify({
            route: "/api/video-token",
            status: 403,
            isAdmin: false,
            error: "Forbidden: Anonymous access to unpublished procedure video token is rejected.",
          })
        );
        return NextResponse.json(
          { error: "Forbidden: Anonymous access to unpublished procedure video token is rejected." },
          { status: 403 }
        );
      }
    }

    // 4. Verify video readiness
    if (proc.video_status !== "ready" || !proc.mux_playback_id) {
      console.log(
        JSON.stringify({
          route: "/api/video-token",
          status: 404,
          isAdmin: false,
          error: "No ready video asset exists for this procedure.",
        })
      );
      return NextResponse.json(
        { error: "No ready video asset exists for this procedure." },
        { status: 404 }
      );
    }

    if (!isMuxConfigured()) {
      console.log(
        JSON.stringify({
          route: "/api/video-token",
          status: 503,
          isAdmin: false,
          error: "Mux video infrastructure is not configured.",
        })
      );
      return NextResponse.json(
        { error: "Mux video infrastructure is not configured." },
        { status: 503 }
      );
    }

    // 5. Generate short-lived signed RS256 playback token (1 hour)
    const { token, header, claims } = await generateMuxPlaybackToken(proc.mux_playback_id, 3600);

    const authCheck = await verifyAdmin();
    console.log(
      JSON.stringify({
        route: "/api/video-token",
        status: 200,
        isAdmin: authCheck.authorized,
        header: { alg: header.alg, kid: header.kid },
        claims: {
          sub: claims.sub,
          aud: claims.aud,
          exp: new Date(claims.exp * 1000).toISOString(),
        },
      })
    );

    return NextResponse.json(
      {
        token,
        playbackId: proc.mux_playback_id,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    const authCheck = await verifyAdmin().catch(() => ({ authorized: false }));
    console.log(
      JSON.stringify({
        route: "/api/video-token",
        status: 500,
        isAdmin: authCheck.authorized,
        error: "Failed to issue video playback token.",
      })
    );
    return NextResponse.json(
      { error: err.message || "Failed to issue video playback token." },
      { status: 500 }
    );
  }
}
