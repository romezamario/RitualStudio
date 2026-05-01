import SiteShell from "@/components/site-shell";
import AdminCourseSessionsManager from "@/components/admin-course-sessions-manager";

export default async function AdminCourseSessionsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  return (
    <SiteShell
      eyebrow="Administrador"
      title="Gestión de sesiones"
      subtitle="Administra fechas, horarios y cupos de un solo curso en una pantalla dedicada."
    >
      <AdminCourseSessionsManager courseId={courseId} />
    </SiteShell>
  );
}
