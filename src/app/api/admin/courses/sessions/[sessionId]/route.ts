import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import { supabaseAdminRequest } from "@/lib/supabase-admin";

type SessionRow = {
  id: string;
  course_id: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  reserved_spots: number;
  is_active: boolean;
};

type SessionPayload = {
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  is_active: boolean;
};

function asSessionPayload(payload: unknown): SessionPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  const startsAt = typeof raw.startsAt === "string" ? raw.startsAt : "";
  const endsAt = typeof raw.endsAt === "string" ? raw.endsAt : "";
  const capacity = typeof raw.capacity === "number" ? raw.capacity : Number(raw.capacity);

  const startsAtDate = new Date(startsAt);

  if (Number.isNaN(startsAtDate.getTime()) || !Number.isInteger(capacity) || capacity <= 0) {
    return null;
  }

  let normalizedEndsAt: string | null = null;

  if (endsAt) {
    const endsAtDate = new Date(endsAt);

    if (Number.isNaN(endsAtDate.getTime()) || endsAtDate.getTime() <= startsAtDate.getTime()) {
      return null;
    }

    normalizedEndsAt = endsAtDate.toISOString();
  }

  return {
    starts_at: startsAtDate.toISOString(),
    ends_at: normalizedEndsAt,
    capacity,
    is_active: raw.isActive === undefined ? true : Boolean(raw.isActive),
  };
}

function toAdminSession(session: SessionRow) {
  return {
    id: session.id,
    courseId: session.course_id,
    startsAt: session.starts_at,
    endsAt: session.ends_at,
    capacity: session.capacity,
    reservedSpots: session.reserved_spots,
    isActive: session.is_active,
  };
}

async function assertAdmin() {
  const { user, isAdmin } = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  return null;
}

export async function PUT(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const guard = await assertAdmin();

  if (guard) {
    return guard;
  }

  const { sessionId } = await context.params;
  const payload = asSessionPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Payload de sesión inválido." }, { status: 400 });
  }

  const { data: existingRows, error: existingError } = await supabaseAdminRequest<SessionRow[]>(
    `/rest/v1/course_sessions?id=eq.${encodeURIComponent(
      sessionId,
    )}&select=id,course_id,starts_at,ends_at,capacity,reserved_spots,is_active&limit=1`,
    {
      method: "GET",
    },
  );

  if (existingError) {
    return NextResponse.json({ error: existingError }, { status: 500 });
  }

  const existing = existingRows?.[0];

  if (!existing) {
    return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });
  }

  if (payload.capacity < existing.reserved_spots) {
    return NextResponse.json(
      {
        error: `No se puede reducir el cupo por debajo de los lugares reservados (${existing.reserved_spots}).`,
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdminRequest<SessionRow[]>(
    `/rest/v1/course_sessions?id=eq.${encodeURIComponent(
      sessionId,
    )}&select=id,course_id,starts_at,ends_at,capacity,reserved_spots,is_active`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const updated = data?.[0];

  if (!updated) {
    return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ data: toAdminSession(updated) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const guard = await assertAdmin();

  if (guard) {
    return guard;
  }

  const { sessionId } = await context.params;

  const { error } = await supabaseAdminRequest<unknown[]>(
    `/rest/v1/course_sessions?id=eq.${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal",
      },
    },
  );

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
