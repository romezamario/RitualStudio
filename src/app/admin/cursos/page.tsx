import SiteShell from "@/components/site-shell";
import AdminCoursesManager from "@/components/admin-courses-manager";

export default function AdminCoursesPage() {
  return (
    <SiteShell
      eyebrow="Administrador"
      title="Gestión de cursos"
      subtitle="Da de alta cursos, administra sesiones por fecha/horario y controla cupos por sesión."
    >
      <AdminCoursesManager />
    </SiteShell>
  );
}
