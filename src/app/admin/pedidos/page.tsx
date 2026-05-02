"use client";

import { useEffect, useMemo, useState } from "react";
import SiteShell from "@/components/site-shell";

type DeliveryStatus = "por_entregar" | "en_reparto" | "entregado";

type AdminOrder = {
  id: string;
  external_reference: string;
  customer_email: string | null;
  created_at: string;
  delivery_status: DeliveryStatus;
  has_products: boolean;
};

const STATUS_OPTIONS: Array<{ value: DeliveryStatus; label: string }> = [
  { value: "por_entregar", label: "Por entregar" },
  { value: "en_reparto", label: "En reparto" },
  { value: "entregado", label: "Entregado" },
];

const DELIVERED_PAGE_SIZE = 10;


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DeliveryStatus>("por_entregar");
  const [deliveredPage, setDeliveredPage] = useState(1);

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

  const ordersByTab = useMemo(() => {
    const byStatus: Record<DeliveryStatus, AdminOrder[]> = {
      por_entregar: [],
      en_reparto: [],
      entregado: [],
    };

    for (const order of orders) {
      byStatus[order.delivery_status].push(order);
    }

    return byStatus;
  }, [orders]);

  const deliveredOrders = ordersByTab.entregado;
  const deliveredTotalPages = Math.max(1, Math.ceil(deliveredOrders.length / DELIVERED_PAGE_SIZE));
  const safeDeliveredPage = Math.min(deliveredPage, deliveredTotalPages);

  useEffect(() => {
    if (safeDeliveredPage !== deliveredPage) {
      setDeliveredPage(safeDeliveredPage);
    }
  }, [deliveredPage, safeDeliveredPage]);

  const visibleOrders = useMemo(() => {
    if (activeTab !== "entregado") {
      return ordersByTab[activeTab];
    }

    const start = (safeDeliveredPage - 1) * DELIVERED_PAGE_SIZE;
    return deliveredOrders.slice(start, start + DELIVERED_PAGE_SIZE);
  }, [activeTab, deliveredOrders, ordersByTab, safeDeliveredPage]);

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

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }} role="tablist" aria-label="Estados de pedidos">
        {STATUS_OPTIONS.map((option) => {
          const isActive = activeTab === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={isActive ? "btn btn-primary" : "btn btn-secondary"}
              onClick={() => setActiveTab(option.value)}
              aria-pressed={isActive}
            >
              {option.label} ({ordersByTab[option.value].length})
            </button>
          );
        })}
      </div>

      <div className="orders-table-card" style={{ marginTop: "1rem" }}>
        <div className="orders-table-head" aria-hidden="true">
          <span>Referencia</span>
          <span>Fecha</span>
          <span>Cliente</span>
          <span>Estado</span>
        </div>
        <div className="orders-table-body">
          {loading ? <div className="studio-card">Cargando pedidos…</div> : null}
          {!loading && visibleOrders.length === 0 ? <div className="studio-card">No hay pedidos para mostrar en esta pestaña.</div> : null}
          {!loading
            ? visibleOrders.map((order) => (
                <div className="orders-table-row" key={order.id}>
                  <summary>
                    <span className="order-reference">{order.external_reference}</span>
                    <span>{new Date(order.created_at).toLocaleString("es-MX")}</span>
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

      {!loading && activeTab === "entregado" && deliveredOrders.length > DELIVERED_PAGE_SIZE ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setDeliveredPage((prev) => Math.max(1, prev - 1))}
            disabled={safeDeliveredPage === 1}
          >
            Anterior
          </button>
          <span>
            Página {safeDeliveredPage} de {deliveredTotalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setDeliveredPage((prev) => Math.min(deliveredTotalPages, prev + 1))}
            disabled={safeDeliveredPage === deliveredTotalPages}
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </SiteShell>
  );
}
