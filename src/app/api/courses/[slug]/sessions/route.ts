import { NextResponse } from "next/server";
import { getPublicCourseBySlug } from "@/lib/courses-catalog";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const { data, error } = await getPublicCourseBySlug(slug);

  if (error || !data) {
    return NextResponse.json({ error: error ?? "Curso no encontrado." }, { status: 404 });
  }

  return NextResponse.json(
    {
      data: {
        courseId: data.course.id,
        slug: data.course.slug,
        sessions: data.sessions,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
