import SiteShell from "@/components/site-shell";

export default function EventosPage() {
  return (
    <SiteShell
      eyebrow="Producción floral"
      title="Diseño floral para eventos"
      subtitle="Integramos dirección artística y ejecución logística para transformar espacios con narrativa botánica coherente y sofisticada."
    >
      <div className="split-panel">
        <div>
          <h2>Bodas y cenas privadas</h2>
          <p>Conceptualización por atmósfera, zonas clave y ritmo visual entre ceremonia, recepción y mesa central.</p>
        </div>
        <div>
          <h2>Activaciones de marca</h2>
          <p>Intervenciones florales para lanzamientos, hospitality y experiencias inmersivas con enfoque editorial.</p>
        </div>
        <div>
          <h2>Servicio integral</h2>
          <p>Incluye visita técnica, producción en taller, instalación en sitio y retiro programado por equipo Ritual.</p>
        </div>
      </div>
    </SiteShell>
  );
}
