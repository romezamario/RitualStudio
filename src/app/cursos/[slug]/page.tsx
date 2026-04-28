import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import CoursePurchaseActions from "@/components/course-purchase-actions";
import { getPublicCourseBySlug } from "@/lib/courses-catalog";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const DETAIL_IMAGE_SIZES = "(max-width: 900px) 100vw, 48vw";

function formatCurrency(value: number) {
  return `$${new Intl.NumberFormat("es-MX").format(value)} MXN`;
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

  return (
    <SiteShell eyebrow="Cursos Ritual Studio" title={course.title} subtitle={course.description ?? "Curso experiencial presencial."}>
      <article className="product-detail">
        <div className="product-detail-image-wrap">
          <Image
            src={course.imageUrl ?? "/images/logo.png"}
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
              <p className="card-label">Sesiones activas</p>
              <p>{sessions.length}</p>
            </section>
          </div>

          <CoursePurchaseActions course={course} initialSessions={sessions} />
        </div>
      </article>
    </SiteShell>
  );
}
