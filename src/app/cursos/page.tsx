import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { listPublicCourses } from "@/lib/courses-catalog";
import { toRenderableProductImageUrl } from "@/lib/product-image-storage";

const CARD_IMAGE_SIZES = "(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 33vw";

function formatCurrency(value: number) {
  return `$${new Intl.NumberFormat("es-MX").format(value)} MXN`;
}

export default async function CoursesPage() {
  const { data: courses, error } = await listPublicCourses();

  return (
    <SiteShell
      eyebrow="Cursos Ritual Studio"
      title="Aprende diseño floral con experiencias presenciales"
      subtitle="Explora cursos disponibles, revisa sesiones y compra tus lugares en línea."
    >
      {error ? <p className="scroll-hint">{error}</p> : null}

      {courses.length ? (
        <div className="feature-grid">
          {courses.map((course) => {
            const courseImage = course.imageUrl
              ? toRenderableProductImageUrl(course.imageUrl, "marketplace-list")
              : "/images/logo.png";

            return (
              <article key={course.id} className="studio-card marketplace-card">
                <div className="card-image-wrap">
                  <Image
                    className="card-image"
                    src={courseImage}
                    alt={course.title}
                    width={1200}
                    height={900}
                    sizes={CARD_IMAGE_SIZES}
                  />
                </div>
                <p className="card-label">Curso presencial</p>
                <h3>{course.title}</h3>
                <p>{course.description ?? "Experiencia guiada por el equipo floral de Ritual Studio."}</p>
                <div className="price-stack">
                  <strong className="price-tag">{formatCurrency(course.price)}</strong>
                  <span>{course.sessionsCount} sesiones publicadas</span>
                </div>
                <div className="marketplace-card-actions">
                  <Link href={`/cursos/${course.slug}`} className="btn btn-ghost">
                    Ver detalle
                  </Link>
                  <Link href={`/cursos/${course.slug}`} className="btn btn-primary">
                    Ver sesiones y comprar
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <article className="studio-card">
          <h2>Próximamente más cursos</h2>
          <p>Estamos preparando nuevas fechas. Escríbenos para recibir aviso cuando publiquemos la próxima edición.</p>
          <Link href="/contacto" className="btn btn-ghost">
            Contactar a Ritual Studio
          </Link>
        </article>
      )}
    </SiteShell>
  );
}
