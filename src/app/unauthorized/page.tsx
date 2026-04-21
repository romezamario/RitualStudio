import Link from "next/link";
import SiteShell from "@/components/site-shell";

export default function UnauthorizedPage() {
  return (
    <SiteShell
      eyebrow="Acceso restringido"
      title="No tienes permisos para entrar aquí"
      subtitle="Si crees que esto es un error, solicita a un administrador que revise tu rol de cuenta."
    >
      <section className="studio-card">
        <p>Esta sección está disponible solo para usuarios con rol administrador.</p>
        <div className="cta-row">
          <Link href="/" className="btn btn-primary">
            Volver al inicio
          </Link>
          <Link href="/mi-cuenta" className="btn btn-ghost">
            Ir a mi cuenta
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
