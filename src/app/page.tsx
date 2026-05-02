import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/components/site-shell";

const WALLPAPER_IMAGE_SIZES = "(max-width: 760px) 100vw, (max-width: 1280px) 50vw, 25vw";

type HomeOption = {
  titulo: string;
  descripcion: string;
  href: string;
  url: string;
  span?: "compact" | "wide" | "tall";
};

const opcionesHome: HomeOption[] = [
  {
    titulo: "Tienda",
    descripcion: "Bouquets listos para entrega con curaduría floral de temporada.",
    href: "/marketplace",
    url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1400&q=80",
    span: "wide"
  },
  {
    titulo: "Experiencias",
    descripcion: "Workshops presenciales para técnica, composición y narrativa botánica.",
    href: "/cursos",
    url: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?auto=format&fit=crop&w=1200&q=80",
    span: "tall"
  },
  {
    titulo: "Diseño a medida",
    descripcion: "Propuestas personalizadas para regalos, espacios y activaciones de marca.",
    href: "/custom",
    url: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?auto=format&fit=crop&w=1200&q=80"
  },
  {
    titulo: "Eventos",
    descripcion: "Ambientaciones florales para bodas íntimas, cenas y hospitality premium.",
    href: "/eventos",
    url: "https://images.unsplash.com/photo-1478144592103-25e218a04891?auto=format&fit=crop&w=1200&q=80"
  },
  {
    titulo: "Nosotros",
    descripcion: "Conoce el estudio, nuestra dirección creativa y el enfoque editorial.",
    href: "/nosotros",
    url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80"
  },
  {
    titulo: "Contacto",
    descripcion: "Agenda una asesoría para transformar tu idea en una propuesta floral integral.",
    href: "/contacto",
    url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
    span: "compact"
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
    </SiteShell>
  );
}
