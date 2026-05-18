import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";

type EditorialSection = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  image: string;
};

type EditorialPick = {
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1800&q=86";

const HERO_IMAGE_SIZES = "100vw";

const editorialSections: EditorialSection[] = [
  {
    eyebrow: "Curated Marketplace",
    title: "Piezas listas para regalar con mirada editorial",
    description:
      "Compra arreglos, objetos premium y gestos florales seleccionados por temporada para decidir rápido sin perder intención.",
    href: "/marketplace",
    cta: "Explorar tienda",
    image: "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1200&q=84"
  },
  {
    eyebrow: "Experiences",
    title: "Workshops íntimos al ritmo del estudio",
    description:
      "Sesiones florales hands-on para rituales personales, equipos creativos y grupos pequeños que quieren crear con calma.",
    href: "/cursos",
    cta: "Ver fechas",
    image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=84"
  },
  {
    eyebrow: "Design by Brief",
    title: "Composiciones a medida para el momento exacto",
    description:
      "Comparte paleta, mensaje, presupuesto u ocasión y el estudio traduce el brief en una pieza floral personalizada.",
    href: "/custom",
    cta: "Iniciar brief",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=84"
  },
  {
    eyebrow: "Events & Spaces",
    title: "Atmósferas florales para celebrar y habitar",
    description:
      "Dirección floral para cenas, lanzamientos, bodas e interiores que necesitan textura, ritmo y detalle memorable.",
    href: "/eventos",
    cta: "Planear evento",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=84"
  }
];

const editorialPicks: EditorialPick[] = [
  {
    label: "Marketplace",
    title: "Arreglos de temporada",
    description: "Una selección premium para enviar hoy, celebrar o acompañar un mensaje importante.",
    href: "/marketplace",
    cta: "Comprar selección"
  },
  {
    label: "Experiencias",
    title: "Rituales para crear",
    description: "Talleres florales pensados para aprender, compartir y volver a mirar los detalles.",
    href: "/cursos",
    cta: "Reservar lugar"
  },
  {
    label: "Brief",
    title: "Diseño personalizado",
    description: "Una ruta curada cuando la ocasión pide una pieza con tono, escala y lenguaje propios.",
    href: "/custom",
    cta: "Enviar brief"
  }
];

export const metadata: Metadata = {
  title: "Home | Ritual Studio",
  description:
    "Ritual Studio es un estudio floral de experiencias, marketplace curado, eventos y diseño a medida para regalos, espacios y momentos memorables.",
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  return (
    <SiteShell
      eyebrow="Ritual Studio"
      title="Flores premium para regalar, celebrar y transformar espacios"
      subtitle="Compra online con entrega confiable o solicita un diseño floral personalizado para momentos memorables."
    >
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-media" aria-hidden="true">
          <Image
            src={HERO_IMAGE_URL}
            alt=""
            fill
            priority
            sizes={HERO_IMAGE_SIZES}
            className="home-hero-image"
          />
        </div>
        <div className="home-hero-content">
          <p className="home-hero-kicker">Ritual Studio · Florería premium</p>
          <h2 id="home-hero-title">Florals for gifting, gatherings & atmosphere.</h2>
          <p className="home-hero-copy">
            Un estudio floral con catálogo curado, experiencias y diseño a medida para convertir cada gesto en ritual.
          </p>
          <div className="home-hero-cta" aria-label="Acciones principales">
            <Link href="/marketplace" className="home-hero-button home-hero-button-primary">
              Explorar colección
            </Link>
            <Link href="/custom" className="home-hero-button home-hero-button-secondary">
              Diseño a medida
            </Link>
          </div>
        </div>
      </section>

      <section className="home-studio-layout" aria-labelledby="the-studio-title">
        <div className="home-studio-copy">
          <p className="section-tag">The Studio</p>
          <h2 id="the-studio-title">Un estudio floral para gestos, reuniones y espacios.</h2>
          <p>
            Ritual Studio crea rituales florales premium para regalar, aprender, celebrar y construir atmósferas. Cada
            camino inicia con una mirada editorial y termina en una pieza considerada para el momento.
          </p>
          <Link href="/contacto" className="text-link">
            Contactar al estudio
          </Link>
        </div>
        <div className="home-studio-note" aria-label="Valores del estudio">
          <span>01</span>
          <p>Selección floral de temporada, paletas suaves y acabados premium.</p>
          <span>02</span>
          <p>Compra online, brief personalizado y experiencias presenciales en una misma ruta.</p>
        </div>
      </section>

      <section className="section-block" aria-labelledby="editorial-paths-title">
        <div className="section-intro">
          <p className="section-tag">Servicios</p>
          <p className="section-microcopy">Cuatro formas de iniciar tu ritual floral.</p>
        </div>
        <h2 id="editorial-paths-title" className="section-heading">
          Elige el camino que mejor cuenta la ocasión.
        </h2>
        <div className="editorial-path-grid">
          {editorialSections.map((section) => (
            <article key={section.href} className="editorial-path-card">
              <div className="editorial-path-image-wrap" aria-hidden="true">
                <Image
                  src={section.image}
                  alt=""
                  fill
                  sizes="(min-width: 900px) 50vw, 100vw"
                  className="editorial-path-image"
                />
              </div>
              <div className="editorial-path-copy">
                <p className="card-label">{section.eyebrow}</p>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
                <Link href={section.href} className="text-link">
                  {section.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block" aria-labelledby="editorial-selection-title">
        <div className="section-intro">
          <p className="section-tag">Editorial Selection</p>
          <p className="section-microcopy">Tres rutas rápidas, curadas por el estudio.</p>
        </div>
        <h2 id="editorial-selection-title" className="section-heading">
          Empieza con una decisión simple.
        </h2>
        <div className="feature-grid home-feature-grid">
          {editorialPicks.map((item, index) => (
            <article key={item.title} className="studio-card home-pick-card">
              <span className="home-pick-number">0{index + 1}</span>
              <p className="card-label">{item.label}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link href={item.href} className="text-link">
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-card contact-highlight" aria-labelledby="final-cta-title">
        <p className="card-label">Final CTA</p>
        <h2 id="final-cta-title">Cuéntanos el momento. Diseñamos el ritual.</h2>
        <p>
          Comparte la ocasión, fecha, ubicación y sensación que quieres crear. Te guiaremos con una propuesta floral
          clara, estética y accionable.
        </p>
        <div className="cta-row" style={{ marginTop: "0.35rem" }}>
          <Link href="/contacto" className="btn btn-primary">
            Contactar Ritual Studio
          </Link>
          <Link href="/eventos" className="btn btn-ghost">
            Explorar eventos y espacios
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
