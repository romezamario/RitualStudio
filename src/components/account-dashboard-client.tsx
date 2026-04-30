"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-context";

export default function AccountDashboardClient() {
  const { user } = useAuth();

  return (
    <div className="feature-grid account-dashboard-grid">
      <article className="studio-card">
        <p className="card-label">Perfil</p>
        <h2>{user?.email ?? "Tu cuenta en Ritual Studio"}</h2>
        <p>
          Correo registrado: <strong>{user?.email ?? "Sin correo disponible"}</strong>
        </p>
        <p>
          Nombre: <strong>{user?.fullName?.trim() || "Aún no registraste tu nombre"}</strong>
        </p>
        <p>
          Teléfono: <strong>{user?.phone?.trim() || "Aún no registraste un teléfono"}</strong>
        </p>
        <p>Rol actual: {user?.role === "admin" ? "Administrador" : "Usuario"}.</p>
        <Link href="/mi-cuenta/perfil" className="text-link">
          Actualizar mis datos
        </Link>
      </article>

      <article className="studio-card">
        <p className="card-label">Pedidos</p>
        <h2>Historial y seguimiento</h2>
        <p>Consulta el estado de tus compras, fechas de entrega y notas de preparación.</p>
        <Link href="/mi-cuenta/pedidos" className="text-link">
          Ver mis pedidos
        </Link>
      </article>

      <article className="studio-card">
        <p className="card-label">Direcciones</p>
        <h2>Direcciones de entrega</h2>
        <p>Guarda ubicaciones frecuentes para comprar más rápido en siguientes pedidos.</p>
        <Link href="/mi-cuenta/direcciones" className="text-link">
          Administrar direcciones
        </Link>
      </article>

      {user?.role === "admin" ? (
        <article className="studio-card">
          <p className="card-label">Administración</p>
          <h2>Accesos de operación</h2>
          <p>
            Gestiona pedidos del estudio, productos del marketplace, cursos con sesiones/cupos y cuentas de
            usuarios con permisos administrativos.
          </p>
          <div className="cta-row">
            <Link href="/admin/pedidos" className="btn btn-ghost">
              Pedidos admin
            </Link>
            <Link href="/admin/productos" className="btn btn-ghost">
              Productos admin
            </Link>
            <Link href="/admin/cursos" className="btn btn-ghost">
              Cursos admin
            </Link>
            <Link href="/admin/usuarios" className="btn btn-ghost">
              Usuarios admin
            </Link>
          </div>
        </article>
      ) : null}
    </div>
  );
}
