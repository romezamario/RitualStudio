import { NextResponse } from "next/server";
import {
  getDeliveryCalendarRangeDays,
  MAX_DELIVERY_CALENDAR_RANGE_DAYS,
  MIN_DELIVERY_CALENDAR_RANGE_DAYS,
  setDeliveryCalendarRangeDays,
} from "@/lib/delivery-calendar-settings";
import { getCurrentUserProfile } from "@/lib/supabase/server";

export async function GET() {
  const { user, isAdmin } = await getCurrentUserProfile();

  if (!user || !isAdmin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const days = await getDeliveryCalendarRangeDays();

  return NextResponse.json({
    days,
    min_days: MIN_DELIVERY_CALENDAR_RANGE_DAYS,
    max_days: MAX_DELIVERY_CALENDAR_RANGE_DAYS,
  });
}

export async function PATCH(request: Request) {
  const { user, isAdmin } = await getCurrentUserProfile();

  if (!user || !isAdmin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { days?: number } | null;
  const requestedDays = Number(body?.days);

  if (!Number.isFinite(requestedDays)) {
    return NextResponse.json({ error: "Valor inválido. Ingresa un número de días." }, { status: 400 });
  }

  if (requestedDays < MIN_DELIVERY_CALENDAR_RANGE_DAYS || requestedDays > MAX_DELIVERY_CALENDAR_RANGE_DAYS) {
    return NextResponse.json(
      { error: `Rango inválido. Usa entre ${MIN_DELIVERY_CALENDAR_RANGE_DAYS} y ${MAX_DELIVERY_CALENDAR_RANGE_DAYS} días.` },
      { status: 400 },
    );
  }

  const { error, days } = await setDeliveryCalendarRangeDays(requestedDays);

  if (error) {
    return NextResponse.json({ error: `No fue posible actualizar el rango de entrega. ${error}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, days });
}
