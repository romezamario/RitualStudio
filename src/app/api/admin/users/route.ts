import { NextResponse } from "next/server";
import { supabaseAdminRequest } from "@/lib/supabase-admin";
import { getCurrentUserProfile } from "@/lib/supabase/server";

type ProfileRow = { id: string; email: string | null; full_name: string | null; role: "user" | "admin" };

async function assertAdmin() {
  const { user, isAdmin } = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  return null;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const getSuperuserEmails = () =>
  new Set((process.env.SUPERUSER_EMAILS ?? "").split(",").map((item) => normalizeEmail(item)).filter(Boolean));

export async function GET() {
  const guard = await assertAdmin();
  if (guard) return guard;

  const { data, error } = await supabaseAdminRequest<ProfileRow[]>(
    "/rest/v1/profiles?select=id,email,full_name,role&role=eq.admin&order=created_at.asc",
    { method: "GET" },
  );

  if (error) return NextResponse.json({ error }, { status: 500 });
  const admins = (data ?? []).map(({ id, email, full_name }) => ({ id, email, full_name }));
  return NextResponse.json({ data: admins, total: admins.length });
}

export async function POST(request: Request) {
  const guard = await assertAdmin();
  if (guard) return guard;

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";

  if (!email) return NextResponse.json({ error: "Debes indicar un correo válido." }, { status: 400 });
  if (getSuperuserEmails().has(email)) {
    return NextResponse.json({ error: "No se permite otorgar la característica de superusuario desde este módulo." }, { status: 403 });
  }

  const { data: profiles, error: lookupError } = await supabaseAdminRequest<ProfileRow[]>(
    `/rest/v1/profiles?select=id,email,full_name,role&email=${encodeURIComponent(`eq.${email}`)}&limit=1`,
    { method: "GET" },
  );

  if (lookupError) return NextResponse.json({ error: lookupError }, { status: 500 });

  const profile = profiles?.[0];
  if (!profile) {
    return NextResponse.json(
      { error: "El usuario no existe o no está dado de alta. Primero crea el usuario y vuelve a intentarlo." },
      { status: 404 },
    );
  }

  if (profile.role === "admin") {
    return NextResponse.json({ ok: true, message: "El usuario ya tiene rol administrador.", data: profile });
  }

  const { data: updated, error: updateError } = await supabaseAdminRequest<ProfileRow[]>(`/rest/v1/profiles?id=eq.${profile.id}`, {
    method: "PATCH",
    body: JSON.stringify({ role: "admin" }),
  });

  if (updateError) return NextResponse.json({ error: updateError }, { status: 500 });

  return NextResponse.json({ ok: true, data: updated?.[0] ?? { ...profile, role: "admin" } }, { status: 201 });
}


export async function DELETE(request: Request) {
  const guard = await assertAdmin();
  if (guard) return guard;

  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";

  if (!userId) return NextResponse.json({ error: "Debes indicar el administrador a dar de baja." }, { status: 400 });

  const { data: profiles, error: lookupError } = await supabaseAdminRequest<ProfileRow[]>(
    `/rest/v1/profiles?select=id,email,full_name,role&id=eq.${encodeURIComponent(userId)}&limit=1`,
    { method: "GET" },
  );

  if (lookupError) return NextResponse.json({ error: lookupError }, { status: 500 });

  const profile = profiles?.[0];

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "El usuario indicado no tiene rol administrador." }, { status: 404 });
  }

  if (getSuperuserEmails().has(normalizeEmail(profile.email ?? ""))) {
    return NextResponse.json({ error: "No se permite dar de baja superusuarios desde este módulo." }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabaseAdminRequest<ProfileRow[]>(`/rest/v1/profiles?id=eq.${profile.id}`, {
    method: "PATCH",
    body: JSON.stringify({ role: "user" }),
  });

  if (updateError) return NextResponse.json({ error: updateError }, { status: 500 });

  return NextResponse.json({
    ok: true,
    message: "Administrador dado de baja correctamente.",
    data: updated?.[0] ?? { ...profile, role: "user" },
  });
}
