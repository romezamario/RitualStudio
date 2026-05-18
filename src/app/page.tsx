import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";

type FloristService = {
  title: string;
  description: string;
  href: string;
  cta: string;
  image: string;
};

type Feature = {
  label: string;
  value: string;
};

type CollectionItem = {
  name: string;
  detail: string;
  image: string;
};

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1800&q=86";

const HERO_SECONDARY_IMAGE_URL =
  "https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=900&q=84";

const STORY_IMAGE_URL =
  "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=1200&q=84";

const IMAGE_SIZES = "(max-width: 900px) 100vw, 50vw";

const services: FloristService[] = [
  {
    title: "Ramos de temporada",
    description: "Composiciones listas para regalar con paletas suaves, flor fresca y entrega coordinada.",
    href: "/marketplace",
    cta: "Comprar ahora",
    image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=82"
  },
  {
    title: "Diseño a medida",
    description: "Brief floral para aniversarios, bienvenidas, mesas íntimas y mensajes que necesitan intención.",
    href: "/custom",
    cta: "Crear mi arreglo",
    image: "https://images.unsplash.com/photo-1455656678494-4d1b5f3e7ad4?auto=format&fit=crop&w=900&q=82"
  },
  {
    title: "Eventos y talleres",
    description: "Dirección floral para celebraciones y experiencias presenciales para crear con calma.",
    href: "/eventos",
    cta: "Planear evento",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=82"
  }
];

const features: Feature[] = [
  { label: "Entregas", value: "Agenda flexible" },
  { label: "Flores", value: "Selección premium" },
  { label: "Estilo", value: "Editorial y natural" }
];

const collection: CollectionItem[] = [
  {
    name: "Bloom blush",
    detail: "Rosas, clavel y follaje vaporoso",
    image: "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=800&q=82"
  },
  {
    name: "Garden note",
    detail: "Texturas silvestres para mesa o regalo",
    image: "https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&w=800&q=82"
  },
  {
    name: "Cream ritual",
    detail: "Flores claras con gesto minimalista",
    image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=82"
  }
];

export const metadata: Metadata = {
  title: "Home | Ritual Studio",
  description:
    "Ritual Studio es una florería de diseño con ramos, arreglos personalizados, talleres y decoración floral para eventos.",
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  return (
    <SiteShell
      eyebrow="Florería de autor · México"
      title="Flores frescas para momentos inolvidables"
      subtitle="Compra ramos de temporada, solicita diseños personalizados y agenda experiencias florales con una estética editorial cálida."
    >
      <section className="florist-hero" aria-labelledby="home-hero-title">
        <div className="florist-hero-copy">
          <p className="card-label">Nuevo lanzamiento floral</p>
          <h2 id="home-hero-title">Arreglos con alma, diseñados para decirlo todo.</h2>
          <p>
            Elige un ramo listo para enviar, solicita una composición personalizada o reserva una experiencia floral con
            el acompañamiento cercano de nuestro estudio.
          </p>
          <div className="florist-actions" aria-label="Acciones principales">
            <Link href="/marketplace" className="btn btn-primary">
              Comprar flores
            </Link>
            <Link href="/custom" className="btn btn-ghost">
              Diseño personalizado
            </Link>
          </div>
        </div>

        <div className="florist-hero-gallery" aria-label="Arreglo floral destacado">
          <div className="florist-main-image-wrap">
            <Image src={HERO_IMAGE_URL} alt="Ramo floral premium en tonos rosados" fill priority sizes="(max-width: 900px) 100vw, 54vw" className="florist-image" />
          </div>
          <div className="florist-floating-card florist-floating-card-top">
            <span>Desde</span>
            <strong>$980 MXN</strong>
            <small>Ramos premium listos para enviar</small>
          </div>
          <div className="florist-floating-card florist-floating-card-bottom">
            <Image src={HERO_SECONDARY_IMAGE_URL} alt="Detalle de flores frescas" width={148} height={148} />
            <div>
              <span>Favorito</span>
              <strong>Ramo Garden Rose</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="florist-feature-strip" aria-label="Beneficios del estudio">
        {features.map((feature) => (
          <article key={feature.label}>
            <span>{feature.label}</span>
            <strong>{feature.value}</strong>
          </article>
        ))}
      </section>

      <section className="florist-services" aria-labelledby="services-title">
        <div className="section-intro">
          <p className="section-tag">Servicios principales</p>
          <h2 id="services-title">Una ruta floral para cada ocasión.</h2>
        </div>
        <div className="florist-service-grid">
          {services.map((service) => (
            <article key={service.title} className="studio-card florist-service-card">
              <div className="card-image-wrap florist-service-image-wrap">
                <Image src={service.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" className="card-image florist-image" />
              </div>
              <p className="card-label">Ritual Studio</p>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <Link href={service.href} className="btn btn-ghost">
                {service.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="florist-story" aria-labelledby="story-title">
        <div className="florist-story-image-wrap">
          <Image src={STORY_IMAGE_URL} alt="Proceso de composicion floral en el estudio" fill sizes={IMAGE_SIZES} className="florist-image" />
        </div>
        <div className="studio-card florist-story-card">
          <p className="card-label">Proceso artesanal</p>
          <h2 id="story-title">Cada pieza se diseña por color, movimiento y emoción.</h2>
          <p>
            Nuestro equipo traduce tu intención en flor fresca, envolturas cuidadas y una entrega clara. La compra se
            mantiene simple, pero el resultado se siente personal y memorable.
          </p>
          <div className="florist-actions">
            <Link href="/nosotros" className="btn btn-primary">
              Conocer el estudio
            </Link>
            <Link href="/contacto" className="btn btn-link">
              Hablar con florista
            </Link>
          </div>
        </div>
      </section>

      <section className="florist-collection" aria-labelledby="collection-title">
        <div className="section-intro">
          <p className="section-tag">Colección destacada</p>
          <h2 id="collection-title">Inspiración para tu próximo gesto.</h2>
        </div>
        <div className="florist-collection-grid">
          {collection.map((item) => (
            <article key={item.name} className="florist-collection-card">
              <Image src={item.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" className="florist-image" />
              <div>
                <span>{item.detail}</span>
                <strong>{item.name}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="florist-cta" aria-labelledby="cta-title">
        <p className="card-label">Entrega, evento o sorpresa</p>
        <h2 id="cta-title">Cuéntanos qué quieres decir con flores.</h2>
        <p>Te guiamos para elegir la pieza correcta, confirmar disponibilidad y coordinar el siguiente ritual.</p>
        <Link href="/contacto" className="btn btn-primary">
          Contactar al estudio
        </Link>
      </section>
    </SiteShell>
  );
}
