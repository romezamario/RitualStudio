import { NextRequest, NextResponse } from "next/server";
import { verifyOtpToken } from "@/lib/supabase-client";
import { sessionCookieNames } from "@/lib/supabase/server";

type VerifyType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

function buildErrorRedirect(request: NextRequest, message: string) {
  const errorUrl = new URL("/auth/error", request.url);
  errorUrl.searchParams.set("message", message);
  return NextResponse.redirect(errorUrl);
}

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return null;
  }

  if (value.startsWith("//")) {
    return null;
  }

  return value;
}

function isValidVerifyType(value: string | null): value is VerifyType {
  return value === "signup" || value === "invite" || value === "magiclink" || value === "recovery" || value === "email_change" || value === "email";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextPath = normalizeNextPath(searchParams.get("next"));

  if (!tokenHash || !type) {
    return buildErrorRedirect(request, "El enlace de confirmación es inválido o está incompleto.");
  }

  if (!isValidVerifyType(type)) {
    return buildErrorRedirect(request, "El tipo de confirmación recibido no es válido.");
  }

  const verification = await verifyOtpToken({
    tokenHash,
    type,
  });

  if (verification.error) {
    return buildErrorRedirect(request, verification.error);
  }

  const successUrl = new URL("/correo-confirmado", request.url);

  if (nextPath) {
    successUrl.searchParams.set("next", nextPath);
  }

  const response = NextResponse.redirect(successUrl);

  if (verification.session) {
    response.cookies.set(sessionCookieNames.access, verification.session.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set(sessionCookieNames.refresh, verification.session.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}
