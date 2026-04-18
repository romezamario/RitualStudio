import Link from "next/link";
import SiteShell from "@/components/site-shell";

export default function Home() {
  return (
    <SiteShell
      eyebrow="Estudio floral editorial · CDMX"
      title="Arreglos florales de autor para espacios, regalos y eventos con carácter"
      subtitle="Inspirados en el lenguaje sobrio y artístico de estudios de diseño contemporáneo, creamos composiciones con intención: textura, escala y narrativa visual adaptada a cada cliente."
    >
      <div className="feature-grid">
        <article className="studio-card">
          <p className="card-label">01</p>
          <h2>Arreglos signature</h2>
          <p>Colección curada para entrega inmediata con estética Ritual: elegante, escultórica y atemporal.</p>
        </article>
        <article className="studio-card">
          <p className="card-label">02</p>
          <h2>Diseño a medida</h2>
          <p>Traducimos tu idea en una propuesta botánica personalizada con dirección creativa y selección estacional.</p>
        </article>
        <article className="studio-card">
          <p className="card-label">03</p>
          <h2>Eventos y hospitality</h2>
          <p>Producción floral para bodas íntimas, cenas de marca y ambientaciones de alto impacto visual.</p>
        </article>
      </div>

      <div className="cta-row">
        <Link href="/custom" className="btn btn-primary">
          Solicitar propuesta
        </Link>
        <Link href="/arreglos" className="btn btn-ghost">
          Ver colección
        </Link>
      </div>
    </SiteShell>
  );
}
