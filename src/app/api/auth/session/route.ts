import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieNames } from "@/lib/supabase/server";

const maxAge = 60 * 60 * 24 * 7;

type SessionBody = {
  accessToken?: string;
  refreshToken?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SessionBody | null;

  if (!body?.accessToken || !body?.refreshToken) {
    return NextResponse.json({ error: "Tokens de sesión incompletos." }, { status: 400 });
  }

  const cookieStore = await cookies();

  cookieStore.set(sessionCookieNames.access, body.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  cookieStore.set(sessionCookieNames.refresh, body.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieNames.access, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set(sessionCookieNames.refresh, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
