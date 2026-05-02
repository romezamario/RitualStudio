import { supabasePublicReadRequest } from "@/lib/supabase-public";

export type CourseCatalogSession = {
  id: string;
  courseId: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number;
  reservedSpots: number;
  isActive: boolean;
};

export type CourseCatalogCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice?: number;
  hasOffer: boolean;
  isActive: boolean;
  imageUrl: string | null;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  has_offer: boolean | null;
  is_active: boolean;
  image_url: string | null;
};

type CourseWithSessionsCountRow = CourseRow & {
  course_sessions: Array<{ count: number }> | null;
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

export async function getPublicCourseBySlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();

  const courseResult = await supabasePublicReadRequest<CourseRow[]>(
    `/rest/v1/courses?select=id,slug,title,description,price,original_price,has_offer,is_active,image_url&slug=eq.${encodeURIComponent(normalizedSlug)}&is_active=eq.true&limit=1`,
    {
      next: {
        revalidate: 60,
        tags: [`course:${normalizedSlug}`],
      },
    },
  );

  if (courseResult.error || !courseResult.data || !courseResult.data.length) {
    return { data: null, error: courseResult.error ?? "Curso no encontrado." };
  }

  const row = courseResult.data[0];

  const sessionsResult = await supabasePublicReadRequest<SessionRow[]>(
    `/rest/v1/course_sessions?select=id,course_id,starts_at,ends_at,capacity,reserved_spots,is_active&course_id=eq.${encodeURIComponent(row.id)}&is_active=eq.true&order=starts_at.asc`,
    {
      next: {
        revalidate: 30,
        tags: [`course-sessions:${normalizedSlug}`],
      },
    },
  );

  if (sessionsResult.error || !sessionsResult.data) {
    return { data: null, error: sessionsResult.error ?? "No fue posible cargar sesiones." };
  }

  const course: CourseCatalogCourse = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    originalPrice: row.original_price !== null ? Number(row.original_price) : undefined,
    hasOffer: row.has_offer ?? false,
    isActive: row.is_active,
    imageUrl: row.image_url,
  };

  const sessions: CourseCatalogSession[] = sessionsResult.data.map((session) => ({
    id: session.id,
    courseId: session.course_id,
    startsAt: session.starts_at,
    endsAt: session.ends_at,
    capacity: session.capacity,
    reservedSpots: session.reserved_spots,
    isActive: session.is_active,
  }));

  return {
    data: {
      course,
      sessions,
    },
    error: null,
  };
}

export type PublicCoursesListItem = CourseCatalogCourse & {
  sessionsCount: number;
};

export async function listPublicCourses() {
  const coursesResult = await supabasePublicReadRequest<CourseWithSessionsCountRow[]>(
    "/rest/v1/courses?select=id,slug,title,description,price,original_price,has_offer,is_active,image_url,course_sessions(count)&is_active=eq.true&order=title.asc",
    {
      next: {
        revalidate: 60,
        tags: ["courses:list"],
      },
    },
  );

  if (coursesResult.error || !coursesResult.data) {
    return { data: [] as PublicCoursesListItem[], error: coursesResult.error ?? "No fue posible cargar cursos." };
  }

  const data: PublicCoursesListItem[] = coursesResult.data.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    originalPrice: row.original_price !== null ? Number(row.original_price) : undefined,
    hasOffer: row.has_offer ?? false,
    isActive: row.is_active,
    imageUrl: row.image_url,
    sessionsCount: row.course_sessions?.[0]?.count ?? 0,
  }));

  return { data, error: null };
}
