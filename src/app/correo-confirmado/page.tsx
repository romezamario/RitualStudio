import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { EmailConfirmationSync } from "@/components/auth/email-confirmation-sync";

type CorreoConfirmadoPageProps = {
  searchParams?: Promise<{
    email?: string;
    role?: string;
    username?: string;
    full_name?: string;
    session?: string;
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
      <EmailConfirmationSync
        email={params?.email ?? null}
        role={params?.role ?? null}
        username={params?.username ?? null}
        fullName={params?.full_name ?? null}
        session={params?.session ?? null}
      />

      <section className="studio-card auth-status-card" aria-live="polite">
        <p>
          Gracias por confirmar tu correo. Tu cuenta ya quedó validada y puedes seguir explorando el sitio o entrar a tu
          área de acceso.
        </p>
        <div className="cta-row">
          <Link href={nextPath ?? "/login"} className="btn btn-primary">
            {nextPath ? "Continuar" : "Iniciar sesión"}
          </Link>
          <Link href="/" className="btn btn-ghost">
            Ir al sitio
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
