import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/components/site-shell";

const GRID_IMAGE_SIZES = "(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 33vw";

const referenciasVisuales = [
  {
    titulo: "Bouquet editorial en tonos blush",
    url: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    titulo: "Mesa floral para evento íntimo",
    url: "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=1200&q=80"
  },
  {
    titulo: "Texturas orgánicas y follaje suave",
    url: "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=1200&q=80"
  }
];
export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  return (
    <SiteShell
      eyebrow="Estudio floral editorial"
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

      <section className="reference-gallery" aria-label="Imágenes de referencia para diseño">
        <p className="card-label">Moodboard inicial</p>
        <h2>Imágenes de ejemplo para la dirección visual</h2>
        <div className="reference-grid">
          {referenciasVisuales.map((item) => (
            <figure key={item.titulo} className="reference-item">
              <Image src={item.url} alt={item.titulo} width={1200} height={900} sizes={GRID_IMAGE_SIZES} />
              <figcaption>{item.titulo}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
