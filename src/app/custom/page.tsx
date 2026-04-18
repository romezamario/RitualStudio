import SiteShell from "@/components/site-shell";

export default function CustomPage() {
  return (
    <SiteShell
      eyebrow="Brief creativo"
      title="Diseño floral a medida"
      subtitle="Comparte tu idea, fecha y presupuesto. Nuestro equipo responde en menos de 24 horas con propuesta visual, rango de inversión y tiempos de producción."
    >
      <form className="studio-form">
        <label>
          Nombre completo
          <input className="input" placeholder="Ej. Mariana López" />
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
          <textarea className="input textarea" placeholder="Cuéntanos estilo, paleta de color, tipo de ocasión y rango aproximado." />
        </label>
        <button type="button" className="btn btn-primary">
          Enviar briefing
        </button>
      </form>
    </SiteShell>
  );
}
