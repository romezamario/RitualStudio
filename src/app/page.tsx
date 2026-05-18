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
};

type EditorialPick = {
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  image: string;
};

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1558898479-33c0057a5d12?auto=format&fit=crop&w=1900&q=86";

const HERO_IMAGE_SIZES = "100vw";

const editorialSections: EditorialSection[] = [
  {
    eyebrow: "Tienda floral",
    title: "Ramos listos para enviar hoy",
    description:
      "Una seleccion de flores frescas, bases y regalos pensada para resolver fechas importantes con entrega cuidada.",
    href: "/marketplace",
    cta: "Comprar flores"
  },
  {
    eyebrow: "Talleres",
    title: "Aprende diseno floral en estudio",
    description:
      "Sesiones presenciales para crear con flor de temporada, tecnicas claras y acompanamiento cercano del equipo.",
    href: "/cursos",
    cta: "Ver talleres"
  },
  {
    eyebrow: "Pedidos especiales",
    title: "Composiciones hechas a medida",
    description:
      "Comparte ocasion, paleta, presupuesto y mensaje. Traducimos el brief en una pieza floral con intencion.",
    href: "/custom",
    cta: "Enviar brief"
  },
  {
    eyebrow: "Eventos",
    title: "Flores para mesas, bodas y marcas",
    description:
      "Direccion floral para celebraciones, cenas, lanzamientos y espacios que necesitan atmosfera memorable.",
    href: "/eventos",
    cta: "Cotizar evento"
  }
];

const editorialPicks: EditorialPick[] = [
  {
    label: "Regalo",
    title: "Bouquet Aurora",
    description: "Rosas suaves, follaje aireado y una envoltura limpia para entregar un gesto luminoso.",
    href: "/marketplace",
    cta: "Ver tienda",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=82"
  },
  {
    label: "Mesa",
    title: "Centro de temporada",
    description: "Volumen bajo, textura botanica y color medido para cenas, reuniones y recepciones.",
    href: "/eventos",
    cta: "Planear evento",
    image: "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=900&q=82"
  },
  {
    label: "A medida",
    title: "Ritual personalizado",
    description: "Una pieza creada desde tu mensaje, fecha, destinatario y presupuesto.",
    href: "/custom",
    cta: "Crear pedido",
    image: "https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?auto=format&fit=crop&w=900&q=82"
  }
];

export const metadata: Metadata = {
  title: "Home | Ritual Studio",
  description:
    "Ritual Studio es una floreria de diseno con ramos, arreglos personalizados, talleres y decoracion floral para eventos.",
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  return (
    <SiteShell
      eyebrow="Floreria de autor"
      title="Flores frescas con entrega, detalle y direccion de diseno"
      subtitle="Ramos, arreglos personalizados, talleres y produccion floral para eventos. Todo desde una mirada botanica elegante y cercana."
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
          <p className="home-hero-kicker">Ritual Studio Floreria</p>
          <h2 id="home-hero-title">Flores para regalar bonito.</h2>
          <p className="home-hero-copy">
            Elige una pieza lista, pide un arreglo especial o agenda decoracion floral para tu proximo momento.
          </p>
          <div className="home-hero-cta" aria-label="Acciones principales">
            <Link href="/marketplace" className="home-hero-button home-hero-button-primary">
              Comprar ahora
            </Link>
            <Link href="/custom" className="home-hero-button home-hero-button-secondary">
              Pedido a medida
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="studio-flow-title">
        <div className="section-intro">
          <p className="section-tag">Como funciona</p>
          <p className="section-microcopy">Compra facil, produccion fresca y entrega coordinada.</p>
        </div>
        <div className="feature-grid ritual-process-grid">
          <article className="studio-card">
            <p className="card-label">01</p>
            <h3>Elige o envia tu idea</h3>
            <p>Compra una pieza de la tienda o manda un brief si necesitas algo especifico.</p>
          </article>
          <article className="studio-card">
            <p className="card-label">02</p>
            <h3>Preparamos con flor fresca</h3>
            <p>Trabajamos la composicion, el empaque y los detalles finales desde el estudio.</p>
          </article>
          <article className="studio-card">
            <p className="card-label">03</p>
            <h3>Coordinamos entrega</h3>
            <p>Confirmamos tiempos, direccion y mensaje para que el gesto llegue completo.</p>
          </article>
        </div>
      </section>

      {editorialSections.map((section) => (
        <section
          key={section.title}
          className="section-block floral-service-row"
          aria-labelledby={`${section.href.slice(1)}-title`}
        >
          <div className="section-intro">
            <p className="section-tag">{section.eyebrow}</p>
            <p className="section-microcopy">Ritual Studio / {section.title}</p>
          </div>
          <article className="studio-card floral-service-card">
            <p className="card-label">{section.eyebrow}</p>
            <h2 id={`${section.href.slice(1)}-title`}>{section.title}</h2>
            <p>{section.description}</p>
            <Link href={section.href} className="text-link">
              {section.cta}
            </Link>
          </article>
        </section>
      ))}

      <section className="section-block" aria-labelledby="editorial-selection-title">
        <div className="section-intro">
          <p className="section-tag">Seleccion floral</p>
          <p className="section-microcopy">Tres formas de empezar con el estudio.</p>
        </div>
        <h2 id="editorial-selection-title" className="section-title-large">
          Favoritos de temporada
        </h2>
        <div className="feature-grid floral-picks-grid">
          {editorialPicks.map((item) => (
            <article key={item.title} className="studio-card floral-pick-card">
              <div className="card-image-wrap">
                <Image
                  className="card-image"
                  src={item.image}
                  alt={item.title}
                  width={900}
                  height={720}
                  sizes="(max-width: 900px) 100vw, 33vw"
                />
              </div>
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
        <p className="card-label">Atencion por WhatsApp</p>
        <h2 id="final-cta-title">Cuentalo como lo imaginas. Lo convertimos en flores.</h2>
        <p>
          Comparte fecha, direccion, presupuesto y el mensaje que quieres enviar. Te guiamos con una propuesta clara.
        </p>
        <div className="cta-row" style={{ marginTop: "0.35rem" }}>
          <Link href="/contacto" className="btn btn-primary">
            Contactar estudio
          </Link>
          <Link href="/marketplace" className="btn btn-ghost">
            Ver tienda
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
