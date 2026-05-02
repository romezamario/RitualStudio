import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import { supabaseAdminRequest } from "@/lib/supabase-admin";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: string;
  original_price: string | null;
  has_offer: boolean | null;
  is_active: boolean;
  image_url: string | null;
};

type SessionRow = {
  id: string;
  course_id: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  reserved_spots: number;
  is_active: boolean;
};

type CoursePayload = {
  slug?: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  has_offer: boolean;
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
  const hasOffer = Boolean(raw.hasOffer);
  const offerPrice = typeof raw.offerPrice === "number" ? raw.offerPrice : Number(raw.offerPrice);

  if (!title || !slug || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  if (hasOffer && (!Number.isFinite(offerPrice) || offerPrice <= 0 || offerPrice >= price)) {
    return null;
  }

  return {
    slug,
    title,
    description: description || null,
    price: hasOffer ? offerPrice : price,
    original_price: hasOffer ? price : null,
    has_offer: hasOffer,
    is_active: raw.isActive === undefined ? true : Boolean(raw.isActive),
    image_url: imageUrl || null,
  };
}

function toAdminCourse(course: CourseRow, sessions: SessionRow[]) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    price: Number(course.price),
    originalPrice: course.original_price ? Number(course.original_price) : undefined,
    hasOffer: course.has_offer ?? false,
    isActive: course.is_active,
    imageUrl: course.image_url,
    sessions: sessions
      .filter((session) => session.course_id === course.id)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .map((session) => ({
        id: session.id,
        courseId: session.course_id,
        startsAt: session.starts_at,
        endsAt: session.ends_at,
        capacity: session.capacity,
        reservedSpots: session.reserved_spots,
        isActive: session.is_active,
      })),
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

export async function GET() {
  const guard = await assertAdmin();

  if (guard) {
    return guard;
  }

  const [coursesResult, sessionsResult] = await Promise.all([
    supabaseAdminRequest<CourseRow[]>(
      "/rest/v1/courses?select=id,slug,title,description,price,original_price,has_offer,is_active,image_url&order=title.asc",
      { method: "GET" },
    ),
    supabaseAdminRequest<SessionRow[]>(
      "/rest/v1/course_sessions?select=id,course_id,starts_at,ends_at,capacity,reserved_spots,is_active&order=starts_at.asc",
      { method: "GET" },
    ),
  ]);

  if (coursesResult.error || sessionsResult.error) {
    return NextResponse.json({ error: coursesResult.error ?? sessionsResult.error }, { status: 500 });
  }

  const courses = coursesResult.data ?? [];
  const sessions = sessionsResult.data ?? [];

  return NextResponse.json({ data: courses.map((course) => toAdminCourse(course, sessions)) });
}

export async function POST(request: Request) {
  const guard = await assertAdmin();

  if (guard) {
    return guard;
  }

  const payload = asCoursePayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Payload de curso inválido." }, { status: 400 });
  }

  const { data, error } = await supabaseAdminRequest<CourseRow[]>("/rest/v1/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const created = data?.[0];

  if (!created) {
    return NextResponse.json({ error: "No fue posible crear el curso." }, { status: 500 });
  }

  return NextResponse.json({ data: toAdminCourse(created, []) }, { status: 201 });
}
