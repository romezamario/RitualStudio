import SiteShell from "@/components/site-shell";

export default function AccountOrdersPage() {
  return (
    <SiteShell
      eyebrow="Mi cuenta"
      title="Mis pedidos"
      subtitle="Aquí podrás revisar el estado de tus pedidos, confirmar detalles de entrega y consultar el historial de compras."
    >
      <div className="studio-card">
        <p className="card-label">Próxima fase</p>
        <h2>Seguimiento de pedidos del cliente</h2>
        <p>
          Este módulo ya está enlazado desde el menú de usuario autenticado y será conectado al backend para mostrar
          pedidos reales por cuenta.
        </p>
      </div>
    </SiteShell>
  );
}
