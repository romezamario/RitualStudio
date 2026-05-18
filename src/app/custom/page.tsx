import SiteShell from "@/components/site-shell";

export default function CustomPage() {
  return (
    <SiteShell
      eyebrow="Brief creativo"
      title="Diseno floral a medida"
      subtitle="Comparte tu idea, fecha y presupuesto. Nuestro equipo responde con una propuesta visual, rango de inversion y tiempos de produccion."
    >
      <form className="studio-form">
        <label>
          Nombre completo
          <input className="input" placeholder="Ej. Mariana Lopez" />
        </label>
        <label>
          WhatsApp
          <input className="input" placeholder="+52 55 0000 0000" />
        </label>
        <label>
          Fecha de entrega
          <input className="input" placeholder="DD/MM/AAAA" />
        </label>
        <label>
          Estilo y presupuesto estimado
          <textarea className="input textarea" placeholder="Cuentanos estilo, paleta de color, tipo de ocasion y rango aproximado." />
        </label>
        <button type="button" className="btn btn-primary">
          Enviar briefing
        </button>
      </form>
    </SiteShell>
  );
}
