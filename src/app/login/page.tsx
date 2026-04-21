import SiteShell from "@/components/site-shell";
import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <SiteShell
      eyebrow="Acceso"
      title="Inicia sesión en Ritual Studio"
      subtitle="Este es el primer paso para habilitar cuentas con roles (usuario, administrador y superusuario), historial de pedidos y gestión operativa del estudio."
    >
      <Suspense fallback={<p className="auth-feedback">Cargando formulario de acceso...</p>}>
        <LoginForm />
      </Suspense>
    </SiteShell>
  );
}
