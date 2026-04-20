import SiteShell from "@/components/site-shell";

export default function AdminOrdersPage() {
  return (
    <SiteShell
      eyebrow="Administrador"
      title="Gestión de pedidos"
      subtitle="Vista operativa para que administración revise pedidos entrantes, prioridades y coordinación de entrega."
    >
      <div className="studio-card">
        <p className="card-label">Panel admin</p>
        <h2>Operación de pedidos</h2>
        <p>
          Esta página quedará reservada para cuentas administradoras y servirá para aprobar pedidos, actualizar estados
          y coordinar producción floral.
        </p>
      </div>
    </SiteShell>
  );
}
