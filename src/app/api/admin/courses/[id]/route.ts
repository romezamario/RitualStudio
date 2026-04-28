import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import { supabaseAdminRequest } from "@/lib/supabase-admin";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: string;
  is_active: boolean;
  image_url: string | null;
};

type CoursePayload = {
  slug: string;
  title: string;
  description: string | null;
  price: number;
  is_active: boolean;
  image_url: string | null;
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asCoursePayload(payload: unknown): CoursePayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const slugInput = typeof raw.slug === "string" ? raw.slug.trim() : "";
  const slug = normalizeSlug(slugInput || title);
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  const price = typeof raw.price === "number" ? raw.price : Number(raw.price);
  const imageUrl = typeof raw.imageUrl === "string" ? raw.imageUrl.trim() : "";

  if (!title || !slug || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  return {
    slug,
    title,
    description: description || null,
    price,
    is_active: raw.isActive === undefined ? true : Boolean(raw.isActive),
    image_url: imageUrl || null,
  };
}

function toAdminCourse(course: CourseRow) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    price: Number(course.price),
    isActive: course.is_active,
    imageUrl: course.image_url,
    sessions: [],
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

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();

  if (guard) {
    return guard;
  }

  const { id } = await context.params;
  const payload = asCoursePayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Payload de curso inválido." }, { status: 400 });
  }

  const { data, error } = await supabaseAdminRequest<CourseRow[]>(
    `/rest/v1/courses?id=eq.${encodeURIComponent(id)}&select=id,slug,title,description,price,is_active,image_url`,
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
    return NextResponse.json({ error: "Curso no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ data: toAdminCourse(updated) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();

  if (guard) {
    return guard;
  }

  const { id } = await context.params;

  const { error } = await supabaseAdminRequest<unknown[]>(`/rest/v1/courses?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
