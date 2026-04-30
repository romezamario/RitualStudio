import { NextResponse } from "next/server";
import { getServerSessionTokens, getUserFromAccessToken } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseClientInfoHeader } from "@/lib/integration-metadata";

type ProfilePatchBody = {
  email?: string;
  full_name?: string;
  phone?: string;
  role?: unknown;
};

function sanitizeNullableText(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function sanitizeEmail(value: unknown): string | null | undefined {
  const sanitized = sanitizeNullableText(value, 320);

  if (sanitized === undefined || sanitized === null) {
    return sanitized;
  }

  const normalized = sanitized.toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

  if (!isValid) {
    return undefined;
  }

  return normalized;
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as ProfilePatchBody | null;

  if (!body) {
    return NextResponse.json({ error: "No se recibió un payload válido." }, { status: 400 });
  }

  if (body.role !== undefined) {
    return NextResponse.json({ error: "No está permitido modificar el rol desde el cliente." }, { status: 403 });
  }

  const email = sanitizeEmail(body.email);
  const fullName = sanitizeNullableText(body.full_name, 120);
  const phone = sanitizeNullableText(body.phone, 40);

  if (
    (body.email !== undefined && email === undefined) ||
    (body.full_name !== undefined && fullName === undefined) ||
    (body.phone !== undefined && phone === undefined)
  ) {
    return NextResponse.json({ error: "Los datos enviados no tienen el formato esperado." }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};

  if (body.email !== undefined) updates.email = email ?? null;
  if (body.full_name !== undefined) updates.full_name = fullName ?? null;
  if (body.phone !== undefined) updates.phone = phone ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No hay cambios para guardar." }, { status: 400 });
  }

  const { accessToken } = await getServerSessionTokens();
  const user = await getUserFromAccessToken(accessToken);

  if (!accessToken || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión para actualizar tu perfil." }, { status: 401 });
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const url = new URL(`${supabaseUrl}/rest/v1/profiles`);
  url.searchParams.set("id", `eq.${user.id}`);
  url.searchParams.set("select", "id,email,role,full_name,phone,created_at,updated_at");

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      Prefer: "return=representation",
      "X-Client-Info": getSupabaseClientInfoHeader(),
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "No fue posible actualizar tu perfil en este momento." },
      { status: response.status }
    );
  }

  const data = (await response.json().catch(() => null)) as Array<Record<string, unknown>> | null;

  return NextResponse.json({ ok: true, profile: data?.[0] ?? null });
}
