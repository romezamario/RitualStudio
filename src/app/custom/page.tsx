import SiteShell from "@/components/site-shell";

export default function CustomPage() {
  return (
    <SiteShell
      title="Diseño a medida"
      subtitle="Cuéntanos el contexto de tu arreglo y te enviamos una propuesta creativa en menos de 24 horas."
    >
      <form className="mt-8 grid max-w-2xl gap-4">
        <input className="input" placeholder="Nombre" />
        <input className="input" placeholder="WhatsApp" />
        <input className="input" placeholder="Fecha de entrega" />
        <textarea className="input min-h-32" placeholder="Cuéntanos estilo, colores y presupuesto estimado" />
        <button type="button" className="btn-primary w-fit">
          Enviar briefing
        </button>
      </form>
    </SiteShell>
  );
}
