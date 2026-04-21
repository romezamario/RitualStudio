import Link from "next/link";
import SiteShell from "@/components/site-shell";

type CorreoConfirmadoPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function CorreoConfirmadoPage({ searchParams }: CorreoConfirmadoPageProps) {
  const params = await searchParams;
  const nextPath = params?.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : null;

  return (
    <SiteShell
      eyebrow="Confirmación"
      title="Tu correo ha sido confirmado"
      subtitle="Ya puedes continuar tu experiencia en Ritual Studio con una navegación fluida y segura."
    >
      <section className="studio-card auth-status-card" aria-live="polite">
        <p>
          Gracias por confirmar tu correo. Tu cuenta ya quedó validada y puedes seguir explorando el sitio o entrar a tu
          área de acceso.
        </p>
        <div className="cta-row">
          <Link href={nextPath ?? "/mi-cuenta"} className="btn btn-primary">
            {nextPath ? "Continuar" : "Ir a mi cuenta"}
          </Link>
          <Link href="/" className="btn btn-ghost">
            Ir al sitio
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
