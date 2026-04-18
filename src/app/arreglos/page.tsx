import SiteShell from "@/components/site-shell";

const arreglos = [
  { nombre: "Nocturne", precio: "$2,400 MXN", nota: "Texturas profundas, paleta burdeos." },
  { nombre: "Ivory Cloud", precio: "$1,950 MXN", nota: "Diseño luminoso, tonos crema y verde seco." },
  { nombre: "Solstice", precio: "$2,800 MXN", nota: "Composición escultórica para espacios protagonistas." }
];

export default function ArreglosPage() {
  return (
    <SiteShell
      title="Colección inicial"
      subtitle="Nuestro catálogo editorial sirve como referencia estética; cada arreglo puede adaptarse por temporada y presupuesto."
    >
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {arreglos.map((arreglo) => (
          <article key={arreglo.nombre} className="card">
            <h2>{arreglo.nombre}</h2>
            <p>{arreglo.nota}</p>
            <strong className="mt-3 block text-amber-200">Desde {arreglo.precio}</strong>
          </article>
        ))}
      </div>
    </SiteShell>
  );
}
