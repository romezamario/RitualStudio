"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-context";

const adminCards = [
  {
    label: "Administración",
    title: "Pedidos admin",
    description: "Revisa y administra pedidos del estudio con seguimiento operativo y validación backend.",
    href: "/admin/pedidos",
    cta: "Ir a pedidos admin"
  },
  {
    label: "Administración",
    title: "Productos admin",
    description: "Gestiona el catálogo del marketplace, disponibilidad y estructura comercial de productos.",
    href: "/admin/productos",
    cta: "Ir a productos admin"
  },
  {
    label: "Administración",
    title: "Cursos admin",
    description: "Administra cursos, sesiones y cupos para mantener el calendario operativo del estudio.",
    href: "/admin/cursos",
    cta: "Ir a cursos admin"
  },
  {
    label: "Administración",
    title: "Usuarios admin",
    description: "Gestiona cuentas de usuarios con permisos administrativos de forma centralizada.",
    href: "/admin/usuarios",
    cta: "Ir a usuarios admin"
  },
  {
    label: "Administración",
    title: "Modo de pagos",
    description: "Configura el modo de operación de Mercado Pago (test o producción) desde una ruta protegida.",
    href: "/admin/pagos",
    cta: "Ir a modo de pagos"
  }
] as const;

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

      {user?.role === "admin"
        ? adminCards.map((card) => (
            <article className="studio-card" key={card.href}>
              <p className="card-label">{card.label}</p>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <Link href={card.href} className="text-link">
                {card.cta}
              </Link>
            </article>
          ))
        : null}
    </div>
  );
}
