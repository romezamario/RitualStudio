import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseClientInfoHeader } from "@/lib/integration-metadata";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return true;
  }

  const providedSecret = request.headers.get("x-cron-secret")?.trim();
  return providedSecret === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: "application/openapi+json",
        "X-Client-Info": getSupabaseClientInfoHeader(),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "Supabase unavailable" }, { status: 503 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Supabase health check failed" }, { status: 500 });
  }
}
