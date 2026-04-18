import SiteShell from "@/components/site-shell";

export default function ContactoPage() {
  return (
    <SiteShell
      eyebrow="Contacto"
      title="Hablemos de tu próximo arreglo"
      subtitle="Atendemos solicitudes para regalos, interior styling y eventos. Cobertura principal en CDMX y área metropolitana."
    >
      <div className="contact-grid">
        <article className="studio-card">
          <h2>WhatsApp</h2>
          <p>+52 55 0000 0000</p>
        </article>
        <article className="studio-card">
          <h2>Email</h2>
          <p>hola@ritualstudio.mx</p>
        </article>
        <article className="studio-card">
          <h2>Horario</h2>
          <p>Lunes a sábado · 9:00 a 18:00</p>
        </article>
      </div>
    </SiteShell>
  );
}
