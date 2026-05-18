import SiteShell from "@/components/site-shell";

export default function NosotrosPage() {
  return (
    <SiteShell
      eyebrow="Nuestra vision"
      title="Un estudio floral con mirada artistica"
      subtitle="Ritual Studio nace para clientes que buscan arreglos con intencion estetica y ejecucion impecable, mas alla de la floreria convencional."
    >
      <div className="story-block">
        <p>
          Disenamos desde la observacion del espacio y de la emocion que quieres comunicar. Trabajamos con flor de temporada,
          materiales nobles y composiciones que equilibran elegancia, naturalidad y fuerza visual.
        </p>
        <p>
          Nuestro proceso mezcla direccion creativa, tecnica botanica y servicio cercano: escuchamos tu brief, proponemos una
          ruta estetica y producimos cada arreglo con precision artesanal.
        </p>
      </div>
    </SiteShell>
  );
}
