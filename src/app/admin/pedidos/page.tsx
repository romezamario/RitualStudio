"use client";

import { useEffect, useState } from "react";
import SiteShell from "@/components/site-shell";

type DeliveryStatus = "por_entregar" | "en_reparto" | "entregado";

type AdminOrder = {
  id: string;
  external_reference: string;
  customer_email: string | null;
  created_at: string;
  total_amount: number;
  delivery_status: DeliveryStatus;
  has_products: boolean;
};

const STATUS_OPTIONS: Array<{ value: DeliveryStatus; label: string }> = [
  { value: "por_entregar", label: "Por entregar" },
  { value: "en_reparto", label: "En reparto" },
  { value: "entregado", label: "Entregado" },
];

function money(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const json = (await response.json().catch(() => null)) as { data?: AdminOrder[]; error?: string } | null;
    if (response.ok && json?.data) setOrders(json.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function updateStatus(orderId: string, status: DeliveryStatus) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });

    if (!response.ok) {
      alert("No se pudo actualizar el estado del pedido.");
      return;
    }

    await loadOrders();
  }

  return (
    <SiteShell eyebrow="Administrador" title="Gestión de pedidos" subtitle="Revisa y actualiza el estado logístico de pedidos con productos.">
      <div className="studio-card">
        <p className="card-label">Panel admin</p>
        <h2>Operación de pedidos</h2>
        <p>Estados habilitados: por entregar, en reparto y entregado. Los correos se envían para pedidos con productos.</p>
      </div>

      <div className="orders-table-card" style={{ marginTop: "1rem" }}>
        <div className="orders-table-head" aria-hidden="true">
          <span>Referencia</span>
          <span>Fecha</span>
          <span>Total</span>
          <span>Cliente</span>
          <span>Estado</span>
        </div>
        <div className="orders-table-body">
          {loading ? <div className="studio-card">Cargando pedidos…</div> : null}
          {!loading && orders.length === 0 ? <div className="studio-card">No hay pedidos para mostrar.</div> : null}
          {!loading
            ? orders.map((order) => (
                <div className="orders-table-row" key={order.id}>
                  <summary>
                    <span className="order-reference">{order.external_reference}</span>
                    <span>{new Date(order.created_at).toLocaleString("es-MX")}</span>
                    <span>{money(order.total_amount)}</span>
                    <span>{order.customer_email ?? "Sin correo"}</span>
                    <span>
                      <select
                        className="input"
                        value={order.delivery_status}
                        onChange={(event) => {
                          void updateStatus(order.id, event.target.value as DeliveryStatus);
                        }}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </summary>
                </div>
              ))
            : null}
        </div>
      </div>
    </SiteShell>
  );
}
