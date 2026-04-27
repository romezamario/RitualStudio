import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { supabaseAdminRequest } from "@/lib/supabase-admin";

type CheckoutSuccessPageProps = {
  searchParams?: Promise<{
    external_reference?: string;
    payment_id?: string;
    status?: string;
    total_amount?: string;
    email?: string;
  }>;
};

type PurchasedItem = {
  slug?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
};

type OrderRow = {
  created_at?: string;
  updated_at?: string;
  customer_email?: string | null;
  metadata?: {
    items?: PurchasedItem[];
  };
};

function toCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function toSafeAmount(rawAmount?: string) {
  const parsed = Number(rawAmount);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(rawStatus?: string) {
  if (!rawStatus) {
    return "Sin estado";
  }

  const normalized = rawStatus.trim().toLowerCase();

  if (normalized === "approved") {
    return "Acreditado";
  }

  if (normalized === "pending" || normalized === "in_process") {
    return "Pendiente";
  }

  if (normalized === "rejected" || normalized === "cancelled") {
    return "Rechazado";
  }

  return rawStatus;
}

async function getOrderByExternalReference(externalReference: string) {
  const { data } = await supabaseAdminRequest<OrderRow[]>(
    `/rest/v1/orders?select=created_at,updated_at,customer_email,metadata&external_reference=eq.${encodeURIComponent(externalReference)}&order=created_at.desc&limit=1`
  );

  return data?.[0] ?? null;
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const externalReference = params?.external_reference?.trim() ?? "No disponible";
  const paymentId = params?.payment_id?.trim() ?? "No disponible";
  const normalizedStatus = normalizeStatus(params?.status);
  const paidAmount = toSafeAmount(params?.total_amount);

  const order = params?.external_reference ? await getOrderByExternalReference(params.external_reference) : null;

  const purchasedItems = Array.isArray(order?.metadata?.items) ? order.metadata.items : [];

  const confirmationIso = order?.updated_at ?? order?.created_at ?? new Date().toISOString();
  const confirmationDate = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(confirmationIso));

  const customerEmail = order?.customer_email ?? params?.email ?? "No disponible";

  return (
    <SiteShell
      eyebrow="Checkout"
      title="Pago confirmado"
      subtitle="Gracias por confiar en Ritual Studio. Tu intención de regalar belleza ya está en camino a florecer."
    >
      <section className="studio-card checkout-success-card" aria-live="polite">
        <p className="card-label">Cierre de ciclo</p>
        <h2>Recibimos tu pago acreditado con éxito</h2>
        <p>
          Agradecemos tu elección y la energía que pusiste en esta compra. Cerramos este ciclo de pago y abrimos la
          preparación de tu pedido con el mismo cuidado espiritual y artesanal de cada arreglo.
        </p>

        <div className="checkout-success-summary" role="status">
          <h3>Resumen de tu compra</h3>
          <ul>
            <li>
              <span>ID de pago</span>
              <strong>{paymentId}</strong>
            </li>
            <li>
              <span>Referencia de orden</span>
              <strong>{externalReference}</strong>
            </li>
            <li>
              <span>Estado</span>
              <strong>{normalizedStatus}</strong>
            </li>
            <li>
              <span>Total pagado</span>
              <strong>{toCurrency(paidAmount)}</strong>
            </li>
            <li>
              <span>Fecha/hora de confirmación (UTC)</span>
              <strong>
                <time dateTime={confirmationIso}>{confirmationDate}</time>
              </strong>
            </li>
            <li>
              <span>Email</span>
              <strong>{customerEmail}</strong>
            </li>
          </ul>
        </div>

        <div className="checkout-success-products">
          <h3>Productos comprados</h3>
          {purchasedItems.length ? (
            <div className="checkout-success-table-wrapper">
              <table className="checkout-success-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasedItems.map((item, index) => {
                    const quantity = Number.isFinite(item.quantity) ? Number(item.quantity) : 0;
                    const unitPrice = Number.isFinite(item.unitPrice) ? Number(item.unitPrice) : 0;
                    const subtotal = Number.isFinite(item.subtotal) ? Number(item.subtotal) : quantity * unitPrice;

                    return (
                      <tr key={`${item.slug ?? item.name ?? "item"}-${index}`}>
                        <td>{item.name ?? item.slug ?? "Producto"}</td>
                        <td>{quantity}</td>
                        <td>{toCurrency(unitPrice)}</td>
                        <td>{toCurrency(subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>
              No encontramos el detalle de productos en esta orden. Si necesitas apoyo, comparte tu ID de pago con
              nuestro equipo.
            </p>
          )}
        </div>

        <div className="cta-row">
          <Link href="/mi-cuenta/pedidos" className="btn btn-primary">
            Ver mis pedidos
          </Link>
          <Link href="/marketplace" className="btn btn-ghost">
            Volver al marketplace
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
