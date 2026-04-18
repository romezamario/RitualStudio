import SiteShell from "@/components/site-shell";

export default function NosotrosPage() {
  return (
    <SiteShell
      eyebrow="Nuestra visión"
      title="Un estudio floral con mirada artística"
      subtitle="Ritual Studio nace para clientes que buscan arreglos con intención estética y ejecución impecable, más allá de la florería convencional."
    >
      <div className="story-block">
        <p>
          Diseñamos desde la observación del espacio y de la emoción que quieres comunicar. Trabajamos con flor de temporada,
          materiales nobles y composiciones que equilibran elegancia, naturalidad y fuerza visual.
        </p>
        <p>
          Nuestro proceso mezcla dirección creativa, técnica botánica y servicio cercano: escuchamos tu brief, proponemos una
          ruta estética y producimos cada arreglo con precisión artesanal.
        </p>
      </div>
    </SiteShell>
  );
}
