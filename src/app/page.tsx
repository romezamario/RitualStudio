import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";

type CategoryItem = {
  title: string;
  description: string;
  href: string;
};

type OccasionItem = {
  title: string;
  microcopy: string;
  imageUrl: string;
  queryTag: string;
};

type FeaturedItem = {
  title: string;
  note: string;
  href: string;
};

type HomeOption = {
  titulo: string;
  descripcion: string;
  href: string;
  url: string;
  span?: "wide" | "tall" | "compact";
};

const WALLPAPER_IMAGE_SIZES = "(max-width: 900px) 100vw, 33vw";

const opcionesHome: HomeOption[] = [
  {
    titulo: "Marketplace",
    descripcion: "Bouquets premium listos para entregar y regalar hoy.",
    href: "/marketplace",
    url: "/images/wallpaper-marketplace.jpg",
    span: "wide"
  },
  {
    titulo: "Diseño a medida",
    descripcion: "Creamos una propuesta floral personalizada para tu ocasión.",
    href: "/custom",
    url: "/images/wallpaper-custom.jpg",
    span: "tall"
  },
  {
    titulo: "Eventos",
    descripcion: "Ambientaciones florales para celebraciones y marcas.",
    href: "/eventos",
    url: "/images/wallpaper-eventos.jpg",
    span: "compact"
  }
];

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

const marketplaceFiltersEnabled = false;

const occasionItems: OccasionItem[] = [
  {
    title: "Cumpleaños",
    microcopy: "Sorprende hoy con flores alegres y listas para regalar.",
    imageUrl: "/images/wallpaper-marketplace.jpg",
    queryTag: "cumpleanos"
  },
  {
    title: "Amor",
    microcopy: "Bouquets románticos para celebrar momentos especiales.",
    imageUrl: "/images/wallpaper-custom.jpg",
    queryTag: "amor"
  },
  {
    title: "Aniversario",
    microcopy: "Composiciones elegantes para recordar su historia juntos.",
    imageUrl: "/images/wallpaper-eventos.jpg",
    queryTag: "aniversario"
  },
  {
    title: "Agradecimiento",
    microcopy: "Un detalle floral para agradecer con intención y estilo.",
    imageUrl: "/images/wallpaper-marketplace.jpg",
    queryTag: "agradecimiento"
  },
  {
    title: "Condolencias",
    microcopy: "Arreglos sobrios para acompañar y expresar apoyo.",
    imageUrl: "/images/wallpaper-custom.jpg",
    queryTag: "condolencias"
  },
  {
    title: "Corporativo",
    microcopy: "Regalos florales para clientes, equipos y aliados clave.",
    imageUrl: "/images/wallpaper-eventos.jpg",
    queryTag: "corporativo"
  }
];

function buildOccasionHref(queryTag: string) {
  if (!marketplaceFiltersEnabled) {
    return "/marketplace";
  }

  const params = new URLSearchParams({ ocasion: queryTag });
  return `/marketplace?${params.toString()}`;
}

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

const valuePillars = [
  {
    label: "Temporada",
    title: "Curaduría floral de temporada",
    note: "Selecciones frescas listas para comprar con confianza."
  },
  {
    label: "Brief",
    title: "Diseño personalizado por brief",
    note: "Convertimos tu idea en una propuesta floral alineada a tu estilo."
  },
  {
    label: "Entrega",
    title: "Entrega cuidada y puntual",
    note: "Coordinamos cada envío para que llegue impecable y a tiempo."
  },
  {
    label: "Soporte",
    title: "Soporte humano para eventos y regalos",
    note: "Te acompañamos cuando necesitas resolver rápido y con criterio."
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
        <div className="section-intro">
          <p className="section-tag">Explora</p>
          <p className="section-microcopy">Elige cómo quieres comenzar tu experiencia floral.</p>
        </div>
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

      <section className="section-block" aria-label="Categorías por ocasión">
        <div className="section-intro">
          <p className="section-tag">Categorías clave</p>
          <p className="section-microcopy">Ideas rápidas para regalar según la ocasión.</p>
        </div>
        <div className="feature-grid">
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
              </div>
      </section>

      <section className="section-block" aria-label="Compra por ocasión">
        <div className="section-intro">
          <p className="section-tag">Compra por ocasión</p>
          <p className="section-microcopy">
            Elige una intención de compra y te llevamos al marketplace con opciones sugeridas.
          </p>
        </div>
        <div className="occasion-grid">
          {occasionItems.map((item) => (
            <Link key={item.title} href={buildOccasionHref(item.queryTag)} className="occasion-card">
              <Image src={item.imageUrl} alt={item.title} width={800} height={560} />
              <div className="occasion-card-body">
                <h3>{item.title}</h3>
                <p>{item.microcopy}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block" aria-label="Más vendidos y selección del estudio">
        <div className="section-intro">
          <p className="section-tag">Selección editorial</p>
          <p className="section-microcopy">Piezas destacadas por el estudio esta semana.</p>
        </div>
        <div className="feature-grid">
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
              </div>
      </section>

      <section className="section-block" aria-label="Pilares de Ritual Studio">
        <div className="section-intro">
          <p className="section-tag">Pilares del estudio</p>
          <p className="section-microcopy">Una experiencia floral clara, elegante y cercana.</p>
        </div>
        <div className="value-grid">
          {valuePillars.map((pillar) => (
            <article key={pillar.title} className="value-card">
              <span className="value-icon" aria-hidden="true">
                {pillar.label.slice(0, 1)}
              </span>
              <p className="value-label">{pillar.label}</p>
              <h2>{pillar.title}</h2>
              <p>{pillar.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-card contact-highlight" aria-label="Asesoría y contacto">
        <p className="card-label">Asesoría floral</p>
        <h2>Conversemos sobre tu idea y armemos una propuesta contigo.</h2>
        <p>
          Si prefieres asesoría antes de comprar, te guiamos para elegir la mejor opción para regalos y eventos.
        </p>
        <div className="cta-row" style={{ marginTop: "0.35rem" }}>
          <Link href="/contacto" className="btn btn-primary">
            Ir a contacto
          </Link>
          <Link href="/eventos" className="btn btn-ghost">
            Ver soluciones para eventos
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
