import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";

type CategoryItem = {
  title: string;
  description: string;
  href: string;
};

type FeaturedItem = {
  title: string;
  note: string;
  href: string;
};

const categoryItems: CategoryItem[] = [
  {
    title: "Cumpleaños",
    description: "Bouquets listos para sorprender con entregas coordinadas.",
    href: "/marketplace"
  },
  {
    title: "Amor",
    description: "Arreglos románticos con selección floral de temporada.",
    href: "/marketplace"
  },
  {
    title: "Agradecimiento",
    description: "Detalles elegantes para agradecer con intención.",
    href: "/marketplace"
  },
  {
    title: "Corporativo",
    description: "Regalos y ambientaciones para equipos, clientes y marcas.",
    href: "/eventos"
  },
  {
    title: "Eventos",
    description: "Diseño floral para bodas, cenas privadas y celebraciones.",
    href: "/eventos"
  },
  {
    title: "Diseño a medida",
    description: "Propuestas personalizadas según estilo, presupuesto y ocasión.",
    href: "/custom"
  }
];

const featuredItems: FeaturedItem[] = [
  {
    title: "Selección semanal del estudio",
    note: "Curaduría de piezas destacadas para envío inmediato.",
    href: "/marketplace"
  },
  {
    title: "Más vendidos para regalar",
    note: "Composiciones favoritas de nuestros clientes.",
    href: "/marketplace"
  },
  {
    title: "Edición personalizada",
    note: "Una base lista para adaptar a mensaje, colores y formato.",
    href: "/custom"
  }
];

const studioDifferentiators = [
  "Curaduría editorial con enfoque en armonía, temporada y narrativa visual.",
  "Calidad floral premium y control de frescura en cada preparación.",
  "Entregas programadas con seguimiento para fechas clave.",
  "Diseño personalizado para regalos, eventos y activaciones de marca."
];

export const metadata: Metadata = {
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
        <div className="home-hero-content">
          <p className="home-hero-kicker">Ritual Studio</p>
          <h2 id="home-hero-title">Flores que elevan cada ocasión.</h2>
          <p>
            Diseño floral premium con entrega confiable y propuestas personalizadas para regalos, eventos y
            espacios con identidad propia.
          </p>
          <div className="home-hero-cta">
            <Link href="/marketplace" className="home-hero-button home-hero-button-primary">
              Comprar flores
            </Link>
            <Link href="/custom" className="home-hero-button home-hero-button-secondary">
              Solicitar diseño a medida
            </Link>
          </div>
        </div>
      </section>

      <section className="home-wallpaper" aria-label="Navegación principal de Ritual Studio">
        {opcionesHome.map((item) => (
          <Link
            key={item.titulo}
            href={item.href}
            className={`wallpaper-card${item.span ? ` wallpaper-card-${item.span}` : ""}`}
          >
            <Image src={item.url} alt={item.titulo} width={1200} height={1400} sizes={WALLPAPER_IMAGE_SIZES} />
            <div className="wallpaper-overlay">
              <p className="wallpaper-kicker">Ritual Studio</p>
              <h2>{item.titulo}</h2>
              <p>{item.descripcion}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="feature-grid" aria-label="Categorías por ocasión">
        {categoryItems.map((item) => (
          <article key={item.title} className="studio-card">
            <p className="card-label">Categoría</p>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <Link href={item.href} className="text-link">
              Explorar opción
            </Link>
          </article>
        ))}
      </section>

      <section className="feature-grid" aria-label="Más vendidos y selección del estudio">
        {featuredItems.map((item) => (
          <article key={item.title} className="studio-card">
            <p className="card-label">Más vendidos · Selección del estudio</p>
            <h2>{item.title}</h2>
            <p>{item.note}</p>
            <Link href={item.href} className="text-link">
              Ver productos
            </Link>
          </article>
        ))}
      </section>

      <section className="story-block" aria-label="Diferenciadores de Ritual Studio">
        <h2>¿Por qué Ritual Studio?</h2>
        {studioDifferentiators.map((differentiator) => (
          <p key={differentiator}>{differentiator}</p>
        ))}
      </section>

      <section className="studio-card" aria-label="Asesoría y contacto" style={{ marginTop: "2.2rem" }}>
        <p className="card-label">Asesoría floral</p>
        <h2>Conversemos sobre tu idea y armemos una propuesta contigo.</h2>
        <p>
          Si necesitas recomendaciones para regalar o acompañamiento para un evento, nuestro equipo puede ayudarte a
          definir la mejor alternativa.
        </p>
        <div className="cta-row" style={{ marginTop: "0.35rem" }}>
          <Link href="/contacto" className="btn btn-primary">
            Contactar al estudio
          </Link>
          <Link href="/eventos" className="btn btn-ghost">
            Ver soluciones para eventos
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
