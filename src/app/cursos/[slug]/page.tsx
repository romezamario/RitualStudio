import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import CoursePurchaseActions from "@/components/course-purchase-actions";
import { getPublicCourseBySlug } from "@/lib/courses-catalog";
import { toRenderableProductImageUrl } from "@/lib/product-image-storage";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const DETAIL_IMAGE_SIZES = "(max-width: 900px) 100vw, 48vw";

function formatCurrency(value: number) {
  return `$${new Intl.NumberFormat("es-MX").format(value)} MXN`;
}

function formatSessionButtonLabel(startsAt: string) {
  return new Date(startsAt).toLocaleString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const { data, error } = await getPublicCourseBySlug(slug);

  if (error || !data) {
    return (
      <SiteShell eyebrow="Cursos" title="Curso no encontrado" subtitle="Revisa las experiencias disponibles.">
        <Link href="/" className="btn btn-ghost">
          Volver al inicio
        </Link>
      </SiteShell>
    );
  }

  const { course, sessions } = data;
  const availableSessions = sessions.filter((session) => session.capacity - session.reservedSpots > 0);
  const courseImage = course.imageUrl
    ? toRenderableProductImageUrl(course.imageUrl, "product-detail")
    : "/images/logo.png";

  return (
    <SiteShell eyebrow="Cursos Ritual Studio" title={course.title} subtitle={course.description ?? "Curso experiencial presencial."}>
      <article className="product-detail">
        <div className="product-detail-image-wrap">
          <Image
            src={courseImage}
            alt={course.title}
            width={1400}
            height={1000}
            className="product-detail-image"
            sizes={DETAIL_IMAGE_SIZES}
            priority
          />
        </div>

        <div className="product-detail-content">
          <p className="card-label">Curso presencial</p>
          <h2>{course.title}</h2>
          <p>{course.description}</p>

          <div className="product-meta-grid">
            <section className="studio-card">
              <p className="card-label">Precio por participante</p>
              <strong className="price-tag">{formatCurrency(course.price)}</strong>
            </section>
            <section className="studio-card">
              <p className="card-label">Sesiones disponibles</p>
              {availableSessions.length > 0 ? (
                <div className="cta-row">
                  {availableSessions.map((session) => (
                    <Link key={session.id} href="#course-booking" className="btn btn-ghost">
                      {formatSessionButtonLabel(session.startsAt)}
                    </Link>
                  ))}
                </div>
              ) : (
                <p>Sin cupo disponible por ahora.</p>
              )}
            </section>
          </div>

          <CoursePurchaseActions course={course} initialSessions={sessions} />
        </div>
      </article>
    </SiteShell>
  );
}
