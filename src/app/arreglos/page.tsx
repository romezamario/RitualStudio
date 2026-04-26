import SiteShell from "@/components/site-shell";
import Image from "next/image";

const CARD_IMAGE_SIZES = "(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 33vw";

const arreglos = [
  {
    nombre: "Nocturne",
    precio: "$2,400 MXN",
    nota: "Rosas de jardín, callas y follaje oscuro en composición vertical dramática.",
    imagen:
      "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=1200&q=80"
  },
  {
    nombre: "Ivory Cloud",
    precio: "$1,950 MXN",
    nota: "Paleta crema y salvia en diseño suave para regalos con lectura minimalista.",
    imagen:
      "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    nombre: "Solstice",
    precio: "$2,800 MXN",
    nota: "Arreglo escultórico de gran volumen para recibidores, hoteles y mesas protagonistas.",
    imagen:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80"
  }
];

export default function ArreglosPage() {
  return (
    <SiteShell
      eyebrow="Colección ritual"
      title="Catálogo inicial de arreglos florales"
      subtitle="Cada pieza es una referencia de estilo. Adaptamos flor, escala y contenedor según temporada, presupuesto y contexto del envío."
    >
      <div className="feature-grid">
        {arreglos.map((arreglo) => (
          <article key={arreglo.nombre} className="studio-card">
            <div className="card-image-wrap">
              <Image
                className="card-image"
                src={arreglo.imagen}
                alt={arreglo.nombre}
                width={1200}
                height={900}
                sizes={CARD_IMAGE_SIZES}
              />
            </div>
            <h2>{arreglo.nombre}</h2>
            <p>{arreglo.nota}</p>
            <strong className="price-tag">Desde {arreglo.precio}</strong>
          </article>
        ))}
      </div>
    </SiteShell>
  );
}
