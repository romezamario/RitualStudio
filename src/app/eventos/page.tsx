import SiteShell from "@/components/site-shell";

export default function EventosPage() {
  return (
    <SiteShell
      title="Diseño floral para eventos"
      subtitle="Conceptualizamos ambientaciones completas para bodas, cenas privadas y activaciones de marca."
    >
      <ul className="mt-8 list-disc space-y-3 pl-5 text-neutral-300">
        <li>Sesión de dirección creativa y moodboard.</li>
        <li>Propuesta por zonas: ceremonia, mesa principal, photo moments.</li>
        <li>Instalación y retiro coordinado por el equipo Ritual.</li>
      </ul>
    </SiteShell>
  );
}
