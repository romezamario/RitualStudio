import { NextResponse } from "next/server";
import { getPaymentMode, setPaymentMode, type PaymentMode } from "@/lib/payment-mode";
import { getCurrentUserProfile, isSuperuserProfile } from "@/lib/supabase/server";

export async function GET() {
  const { user, profile, isAdmin } = await getCurrentUserProfile();

  if (!user || !isAdmin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const mode = await getPaymentMode();

  return NextResponse.json({ mode, is_superuser: isSuperuserProfile(profile) });
}

export async function PATCH(request: Request) {
  const { user, profile, isAdmin } = await getCurrentUserProfile();

  if (!user || !isAdmin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (!isSuperuserProfile(profile)) {
    return NextResponse.json({ error: "Solo superusuario puede cambiar el modo de pagos." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { mode?: PaymentMode } | null;

  if (!body || (body.mode !== "prod" && body.mode !== "test")) {
    return NextResponse.json({ error: "Modo inválido. Usa 'prod' o 'test'." }, { status: 400 });
  }

  const { error } = await setPaymentMode(body.mode);

  if (error) {
    return NextResponse.json({ error: `No fue posible actualizar modo de pagos. ${error}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: body.mode });
}
