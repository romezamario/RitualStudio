import SiteShell from "@/components/site-shell";

export default function AdminUsersPage() {
  return (
    <SiteShell
      eyebrow="Administrador"
      title="Gestión de usuarios"
      subtitle="Espacio para administrar roles, permisos y estado de cuentas dentro del sitio."
    >
      <div className="studio-card">
        <p className="card-label">Panel admin</p>
        <h2>Control de roles</h2>
        <p>
          Este módulo será la base para administrar usuarios normales y administradores con diferentes permisos de
          navegación y operación.
        </p>
      </div>
    </SiteShell>
  );
}
