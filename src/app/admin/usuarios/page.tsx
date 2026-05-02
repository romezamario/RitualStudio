import AdminUsersManager from "@/components/admin-users-manager";
import SiteShell from "@/components/site-shell";

export default function AdminUsersPage() {
  return (
    <SiteShell
      eyebrow="Administrador"
      title="Gestión de usuarios"
      subtitle="Da de alta administradores existentes en Supabase y consulta cuántos administradores activos hay."
    >
      <AdminUsersManager />
    </SiteShell>
  );
}
