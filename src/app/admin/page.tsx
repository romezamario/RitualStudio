import Link from "next/link";
import SiteShell from "@/components/site-shell";

export default function AdminHomePage() {
  return (
    <SiteShell
      eyebrow="Administrador"
      title="Panel administrativo"
      subtitle="Accesos de operación protegidos por rol admin en Supabase (RLS + validación server-side)."
    >
      <div className="feature-grid">
        <article className="studio-card">
          <p className="card-label">Pedidos</p>
          <h2>Operación de pedidos</h2>
          <p>Revisa pedidos entrantes y coordina su seguimiento operativo.</p>
          <Link href="/admin/pedidos" className="text-link">
            Ir a gestión de pedidos
          </Link>
        </article>

        <article className="studio-card">
          <p className="card-label">Usuarios</p>
          <h2>Roles y permisos</h2>
          <p>Administra perfiles y define privilegios de administración.</p>
          <Link href="/admin/usuarios" className="text-link">
            Ir a gestión de usuarios
          </Link>
        </article>

        <article className="studio-card">
          <p className="card-label">Productos</p>
          <h2>Alta y edición de catálogo</h2>
          <p>Crea productos nuevos y actualiza precio, oferta, descripción y foto.</p>
          <Link href="/admin/productos" className="text-link">
            Ir a gestión de productos
          </Link>
        </article>

        <article className="studio-card">
          <p className="card-label">Cursos</p>
          <h2>Gestión de sesiones y cupos</h2>
          <p>Da de alta cursos, define fechas/horarios y ajusta cupos por sesión.</p>
          <Link href="/admin/cursos" className="text-link">
            Ir a gestión de cursos
          </Link>
        </article>

        <article className="studio-card">
          <p className="card-label">Pagos</p>
          <h2>Modo test / producción</h2>
          <p>Permite conmutar el entorno de cobro de Mercado Pago para operación controlada.</p>
          <Link href="/admin/pagos" className="text-link">
            Ir a modo de pago y verificación
          </Link>
        </article>

      </div>
    </SiteShell>
  );
}
