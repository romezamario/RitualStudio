import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";

type StudioPath = {
  title: string;
  location: string;
  description: string;
  href: string;
  cta: string;
  image: string;
};

type RitualCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1800&q=86";

const PROCESS_IMAGE_URL =
  "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=1200&q=84";

const WORKSHOP_IMAGE_URL =
  "https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&w=1200&q=84";

const IMAGE_SIZES = "(max-width: 900px) 100vw, 50vw";

const studioPaths: StudioPath[] = [
  {
    title: "Tienda floral",
    location: "Marketplace curado",
    description: "Piezas listas para enviar, seleccionadas por temporada y pensadas como gestos cotidianos.",
    href: "/marketplace",
    cta: "Descubrir",
    image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=82"
  },
  {
    title: "Experiencias",
    location: "Talleres y sesiones",
    description: "Encuentros pausados para aprender composición floral, crear con las manos y compartir mesa.",
    href: "/cursos",
    cta: "Ver fechas",
    image: "https://images.unsplash.com/photo-1455656678494-4d1b5f3e7ad4?auto=format&fit=crop&w=900&q=82"
  },
  {
    title: "Eventos",
    location: "Celebraciones y espacios",
    description: "Dirección floral para cenas, lanzamientos, bodas íntimas e interiores con atmósfera.",
    href: "/eventos",
    cta: "Planear",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=82"
  }
];

const rituals: RitualCard[] = [
  {
    eyebrow: "01 · Regalo",
    title: "Un arreglo listo para sorprender",
    description: "Elige una pieza editorial, agrega mensaje y coordina entrega desde el checkout.",
    href: "/marketplace",
    cta: "Comprar flores"
  },
  {
    eyebrow: "02 · Brief",
    title: "Una composición hecha a la medida",
    description: "Comparte paleta, ocasión, presupuesto y fecha para traducir la intención en flores.",
    href: "/custom",
    cta: "Enviar brief"
  },
  {
    eyebrow: "03 · Comunidad",
    title: "Un taller para crear con calma",
    description: "Sesiones íntimas para explorar formas, texturas y pequeños rituales de temporada.",
    href: "/cursos",
    cta: "Reservar experiencia"
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
      eyebrow="Floral studio · MX"
      title="Flores, talleres y rituales para crear conexión"
      subtitle="Un universo floral inspirado en la calma de los talleres creativos: arreglos premium, experiencias guiadas y dirección para espacios memorables."
    >
      <section className="yonobi-hero" aria-labelledby="home-hero-title">
        <div className="yonobi-hero-media" aria-hidden="true">
          <Image src={HERO_IMAGE_URL} alt="" fill priority sizes="100vw" className="yonobi-hero-image" />
        </div>
        <div className="yonobi-hero-panel">
          <p className="yonobi-kicker">Ritual Studio</p>
          <h2 id="home-hero-title">The beauty of flowers, process and gathering.</h2>
          <p>
            Diseñamos piezas florales y experiencias con una estética serena, artesanal y editorial: de la compra
            inmediata al gesto completamente personalizado.
          </p>
          <div className="yonobi-hero-actions" aria-label="Acciones principales">
            <Link href="/marketplace" className="yonobi-button yonobi-button-primary">
              Explorar colección
            </Link>
            <Link href="/cursos" className="yonobi-button yonobi-button-secondary">
              Ver talleres
            </Link>
          </div>
        </div>
      </section>

      <section className="yonobi-manifesto" aria-labelledby="manifesto-title">
        <p className="yonobi-kicker">A place to create and connect</p>
        <h2 id="manifesto-title">Un estudio floral para momentos que piden intención.</h2>
        <p>
          Tomamos la calidez visual de un café-estudio —materiales naturales, ritmo lento y comunidad— y la llevamos a
          flores premium para regalar, aprender, celebrar y transformar espacios.
        </p>
      </section>

      <section className="yonobi-split" aria-labelledby="process-title">
        <div className="yonobi-split-copy">
          <p className="yonobi-kicker">The beauty of process</p>
          <h2 id="process-title">Cada arreglo nace de observar temporada, textura y gesto.</h2>
          <p>
            Como en un taller abierto, el proceso importa: elegimos flores, follajes y objetos con una mirada tranquila
            para que cada compra se sienta personal, incluso cuando está lista para enviar.
          </p>
          <Link href="/nosotros" className="yonobi-text-link">
            Conoce el estudio
          </Link>
        </div>
        <div className="yonobi-split-image-wrap">
          <Image src={PROCESS_IMAGE_URL} alt="Flores en proceso de composición" fill sizes={IMAGE_SIZES} className="yonobi-split-image" />
        </div>
      </section>

      <section className="yonobi-rhythm" aria-labelledby="rhythm-title">
        <p className="yonobi-kicker">A new rhythm</p>
        <h2 id="rhythm-title">Haz espacio para un ritual más lento.</h2>
        <p>
          Compra una pieza de temporada, agenda un taller o envíanos un brief. Ritual Studio acompaña el momento con una
          experiencia clara: selección cuidada, checkout confiable y seguimiento humano.
        </p>
        <Link href="/custom" className="yonobi-button yonobi-button-primary">
          Iniciar diseño a medida
        </Link>
      </section>

      <section className="yonobi-studios" aria-labelledby="studios-title">
        <div className="yonobi-section-heading">
          <p className="yonobi-kicker">Ritual Studio paths</p>
          <h2 id="studios-title">Tres formas de entrar al estudio.</h2>
        </div>
        <div className="yonobi-studio-grid">
          {studioPaths.map((path) => (
            <Link key={path.title} href={path.href} className="yonobi-studio-card">
              <Image src={path.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" className="yonobi-studio-image" />
              <span className="yonobi-studio-overlay" aria-hidden="true" />
              <span className="yonobi-studio-content">
                <span className="yonobi-card-location">{path.location}</span>
                <span className="yonobi-card-title">{path.title}</span>
                <span className="yonobi-card-description">{path.description}</span>
                <span className="yonobi-card-cta">{path.cta}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="yonobi-workshops" aria-labelledby="workshops-title">
        <div className="yonobi-workshops-copy">
          <p className="yonobi-kicker">Floral workshops</p>
          <h2 id="workshops-title">Experiencias que reúnen manos, flores y conversación.</h2>
          <p>
            Talleres y formatos privados para equipos, grupos íntimos y personas que quieren explorar composición floral
            en un ambiente cálido y guiado.
          </p>
          <Link href="/cursos" className="yonobi-text-link">
            Ver todas las experiencias
          </Link>
        </div>
        <article className="yonobi-product-card">
          <div className="yonobi-product-image-wrap">
            <Image src={WORKSHOP_IMAGE_URL} alt="Mesa de taller floral" fill sizes={IMAGE_SIZES} className="yonobi-product-image" />
          </div>
          <div className="yonobi-product-body">
            <p className="yonobi-kicker">Featured experience</p>
            <h3>Workshop floral de temporada</h3>
            <p>Una sesión para crear una pieza con flores seleccionadas por color, aroma y movimiento.</p>
            <Link href="/cursos" className="yonobi-button yonobi-button-secondary">
              Reservar lugar
            </Link>
          </div>
        </article>
      </section>

      <section className="yonobi-ritual-grid" aria-labelledby="selection-title">
        <div className="yonobi-section-heading">
          <p className="yonobi-kicker">Editorial selection</p>
          <h2 id="selection-title">Elige el ritual que necesitas hoy.</h2>
        </div>
        <div className="yonobi-ritual-cards">
          {rituals.map((ritual) => (
            <article key={ritual.title} className="yonobi-ritual-card">
              <p>{ritual.eyebrow}</p>
              <h3>{ritual.title}</h3>
              <span>{ritual.description}</span>
              <Link href={ritual.href} className="yonobi-text-link">
                {ritual.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="yonobi-community" aria-labelledby="community-title">
        <div>
          <p className="yonobi-kicker">Join the Ritual community</p>
          <h2 id="community-title">Recibe inspiración, nuevos rituales y actualizaciones del estudio.</h2>
        </div>
        <Link href="/contacto" className="yonobi-button yonobi-button-primary">
          Contactar al estudio
        </Link>
      </section>
    </SiteShell>
  );
}
