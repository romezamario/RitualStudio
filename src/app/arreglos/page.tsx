import SiteShell from "@/components/site-shell";

const arreglos = [
  {
    nombre: "Nocturne",
    precio: "$2,400 MXN",
    nota: "Rosas de jardín, callas y follaje oscuro en composición vertical dramática."
  },
  {
    nombre: "Ivory Cloud",
    precio: "$1,950 MXN",
    nota: "Paleta crema y salvia en diseño suave para regalos con lectura minimalista."
  },
  {
    nombre: "Solstice",
    precio: "$2,800 MXN",
    nota: "Arreglo escultórico de gran volumen para recibidores, hoteles y mesas protagonistas."
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
            <h2>{arreglo.nombre}</h2>
            <p>{arreglo.nota}</p>
            <strong className="price-tag">Desde {arreglo.precio}</strong>
          </article>
        ))}
      </div>
    </SiteShell>
  );
}
