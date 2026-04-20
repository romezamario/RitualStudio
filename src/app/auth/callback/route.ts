import { NextRequest, NextResponse } from "next/server";
import { verifyOtpToken } from "@/lib/supabase-client";

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

  if (verification.user?.email) {
    successUrl.searchParams.set("email", verification.user.email);
    successUrl.searchParams.set("role", verification.user.role);

    if (verification.user.username) {
      successUrl.searchParams.set("username", verification.user.username);
    }

    if (verification.user.fullName) {
      successUrl.searchParams.set("full_name", verification.user.fullName);
    }
  }

  successUrl.searchParams.set("session", verification.sessionCreated ? "1" : "0");

  if (nextPath) {
    successUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(successUrl);
}
