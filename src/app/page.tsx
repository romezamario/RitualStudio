import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";

type SignatureService = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  image: string;
};

type RitualStep = {
  step: string;
  title: string;
  description: string;
};

const heroImage = "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=1600&q=88";
const heroAccentImage = "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=84";

const signatureServices: SignatureService[] = [
  {
    eyebrow: "Colección online",
    title: "Arreglos listos para regalar",
    description: "Ramos y piezas de temporada con una estética suave, femenina y editorial para resolver un detalle especial sin perder intención.",
    href: "/marketplace",
    cta: "Comprar flores",
    image: "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=900&q=84"
  },
  {
    eyebrow: "Momentos privados",
    title: "Diseño floral a medida",
    description: "Traducimos ocasión, paleta y mensaje en una composición personalizada para cumpleaños, aniversarios o gestos íntimos.",
    href: "/custom",
    cta: "Solicitar diseño",
    image: "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=900&q=84"
  },
  {
    eyebrow: "Celebraciones",
    title: "Eventos con atmósfera floral",
    description: "Dirección floral para cenas, lanzamientos, bodas pequeñas y espacios que necesitan textura, ritmo y una experiencia memorable.",
    href: "/eventos",
    cta: "Planear evento",
    image: "https://images.unsplash.com/photo-1526394931762-36a3e30d4e41?auto=format&fit=crop&w=900&q=84"
  }
];

const ritualSteps: RitualStep[] = [
  {
    step: "01",
    title: "Elige el ritual",
    description: "Compra una pieza curada, reserva una experiencia o comparte el brief de tu ocasión."
  },
  {
    step: "02",
    title: "Cuidamos el detalle",
    description: "Validamos flores, timing, mensaje y entrega para mantener una experiencia clara."
  },
  {
    step: "03",
    title: "Recibe o celebra",
    description: "El arreglo llega con una composición intencional, lista para regalar o transformar el espacio."
  }
];

const occasions = ["Cumpleaños", "Aniversarios", "Agradecimientos", "Eventos", "Mesas", "Workshops"];

export const metadata: Metadata = {
  title: "Home | Ritual Studio",
  description:
    "Ritual Studio es un estudio floral premium para arreglos a domicilio, regalos personalizados, experiencias y eventos con dirección floral editorial.",
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  return (
    <SiteShell
      eyebrow="Florería premium · Ritual Studio"
      title="Flores frescas para celebrar cada momento especial"
      subtitle="Arreglos florales, regalos a domicilio, experiencias y eventos diseñados con una mirada editorial, cálida y profundamente intencional."
    >
      <div className="home-landing" aria-label="Rediseño visual principal de Ritual Studio">
        <section className="florist-hero" aria-labelledby="florist-hero-title">
          <div className="florist-hero-copy">
            <p className="florist-pill">Entrega premium · Diseño personalizado · Flores de temporada</p>
            <h2 id="florist-hero-title">Un gesto floral para decirlo todo.</h2>
            <p>
              Inspirado en una florería contemporánea: tonos crema, acentos rosados, imágenes suaves y una experiencia
              simple para descubrir, elegir y regalar flores con intención.
            </p>
            <div className="florist-hero-actions" aria-label="Acciones principales">
              <Link href="/marketplace" className="btn btn-primary florist-hero-primary">
                Ver colección
              </Link>
              <Link href="/contacto" className="btn btn-ghost florist-hero-secondary">
                Hablar con el estudio
              </Link>
            </div>
          </div>

          <div className="florist-hero-gallery" aria-hidden="true">
            <div className="florist-hero-image-wrap florist-hero-image-main">
              <Image src={heroImage} alt="" fill priority sizes="(min-width: 900px) 48vw, 100vw" className="florist-image" />
            </div>
            <div className="florist-hero-image-wrap florist-hero-image-accent">
              <Image src={heroAccentImage} alt="" fill sizes="(min-width: 900px) 18vw, 45vw" className="florist-image" />
            </div>
            <div className="florist-floating-card">
              <span>Desde</span>
              <strong>flores frescas</strong>
              <span>hasta eventos completos</span>
            </div>
          </div>
        </section>

        <section className="florist-marquee" aria-label="Ocasiones disponibles">
          {occasions.map((occasion) => (
            <span key={occasion}>{occasion}</span>
          ))}
        </section>

        <section className="florist-section florist-services" aria-labelledby="services-title">
          <div className="florist-section-heading">
            <p className="section-tag">Servicios</p>
            <h2 id="services-title">Diseñamos flores para regalos, espacios y celebraciones.</h2>
            <p>
              El rediseño prioriza una lectura visual más limpia: tarjetas grandes, fotografía protagonista y llamadas a
              la acción directas hacia las rutas existentes.
            </p>
          </div>

          <div className="florist-service-grid">
            {signatureServices.map((service) => (
              <article key={service.title} className="florist-service-card">
                <div className="florist-service-image">
                  <Image src={service.image} alt="" fill sizes="(min-width: 900px) 30vw, 100vw" className="florist-image" />
                </div>
                <div className="florist-service-copy">
                  <p className="card-label">{service.eyebrow}</p>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <Link href={service.href} className="text-link">
                    {service.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="florist-split" aria-labelledby="atelier-title">
          <div className="florist-split-media">
            <Image
              src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=84"
              alt=""
              fill
              sizes="(min-width: 900px) 42vw, 100vw"
              className="florist-image"
            />
          </div>
          <div className="florist-split-copy">
            <p className="section-tag">El atelier</p>
            <h2 id="atelier-title">Flores con sensibilidad, detalle y timing.</h2>
            <p>
              Ritual Studio combina la calidez de una florería local con una dirección visual premium. Cada pieza se
              construye alrededor de la ocasión, la temporada y el mensaje que quieres entregar.
            </p>
            <div className="florist-note-grid">
              <span>Selección de temporada</span>
              <span>Composición editorial</span>
              <span>Experiencia cuidada</span>
            </div>
            <Link href="/nosotros" className="btn btn-ghost">
              Conocer el estudio
            </Link>
          </div>
        </section>

        <section className="florist-section" aria-labelledby="process-title">
          <div className="florist-section-heading florist-section-heading-compact">
            <p className="section-tag">Proceso</p>
            <h2 id="process-title">Un flujo simple, sin cambiar la lógica existente.</h2>
          </div>
          <div className="florist-process-grid">
            {ritualSteps.map((item) => (
              <article key={item.step} className="florist-process-card">
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="florist-final-cta" aria-labelledby="final-cta-title">
          <p className="section-tag">Ritual Studio</p>
          <h2 id="final-cta-title">¿Qué momento quieres convertir en flores?</h2>
          <p>
            Compra una pieza disponible o cuéntanos el brief para crear un arreglo con intención, paleta y presencia.
          </p>
          <div className="florist-hero-actions">
            <Link href="/marketplace" className="btn btn-primary">
              Comprar ahora
            </Link>
            <Link href="/custom" className="btn btn-ghost">
              Pedir diseño a medida
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
