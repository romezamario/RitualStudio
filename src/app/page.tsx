import Link from "next/link";
import SiteShell from "@/components/site-shell";

export default function Home() {
  return (
    <SiteShell
      title="Diseño floral con dirección artística"
      subtitle="Creamos arreglos a medida para regalos, hospitality y eventos íntimos. Cada pieza nace de una conversación con tu idea, estilo y ocasión."
    >
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <article className="card">
          <h2>Arreglos signature</h2>
          <p>Piezas listas para ordenar con lenguaje estético Ritual.</p>
        </article>
        <article className="card">
          <h2>Diseño a medida</h2>
          <p>Brief creativo, selección de flor y propuesta personalizada.</p>
        </article>
        <article className="card">
          <h2>Eventos</h2>
          <p>Dirección floral para bodas, cenas de marca y experiencias.</p>
        </article>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/custom" className="btn-primary">
          Solicitar diseño personalizado
        </Link>
        <Link href="/arreglos" className="btn-secondary">
          Ver colección inicial
        </Link>
      </div>
    </SiteShell>
  );
}
