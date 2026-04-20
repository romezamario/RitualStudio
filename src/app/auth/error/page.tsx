import Link from "next/link";
import SiteShell from "@/components/site-shell";

type AuthErrorPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

const DEFAULT_ERROR_MESSAGE =
  "No pudimos validar tu enlace de confirmación. Puede que haya expirado o ya fue utilizado.";

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const safeMessage = params?.message?.trim() ? params.message : DEFAULT_ERROR_MESSAGE;

  return (
    <SiteShell
      eyebrow="Confirmación"
      title="No fue posible confirmar tu correo"
      subtitle="No te preocupes: puedes volver a intentarlo en unos segundos desde tu cuenta."
    >
      <section className="studio-card auth-status-card" aria-live="polite">
        <p>{safeMessage}</p>
        <div className="cta-row">
          <Link href="/login" className="btn btn-primary">
            Volver al login
          </Link>
          <Link href="/contacto" className="btn btn-ghost">
            Solicitar ayuda
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
