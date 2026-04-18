import SiteShell from "@/components/site-shell";

export default function ContactoPage() {
  return (
    <SiteShell
      title="Hablemos de tu pedido"
      subtitle="Atendemos por WhatsApp y correo. Cobertura principal: CDMX y área metropolitana."
    >
      <div className="mt-8 space-y-2 text-neutral-300">
        <p>WhatsApp: +52 55 0000 0000</p>
        <p>Email: hola@ritualstudio.mx</p>
        <p>Horario: Lunes a sábado · 9:00 a 18:00</p>
      </div>
    </SiteShell>
  );
}
