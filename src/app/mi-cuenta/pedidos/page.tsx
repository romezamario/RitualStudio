import { redirect } from "next/navigation";
import SiteShell from "@/components/site-shell";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getServerSessionTokens, getUserFromAccessToken } from "@/lib/supabase/server";
import { getSupabaseClientInfoHeader } from "@/lib/integration-metadata";

type OrdersPageProps = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
  }>;
};

type OrderRow = {
  id: string;
  external_reference: string;
  status: string | null;
  total_amount: number | string | null;
  created_at: string;
  metadata?: {
    mixed_items_summary?: {
      products?: Array<{
        slug?: string;
        name?: string;
        quantity?: number;
        unitPrice?: number;
        subtotal?: number;
      }>;
      courses?: Array<{
        slug?: string;
        name?: string;
        quantity?: number;
        unitPrice?: number;
        subtotal?: number;
        course_session_id?: string | null;
        session_starts_at?: string | null;
        participants?: string[];
      }>;
    };
  } | null;
};

type PaymentRow = {
  order_id: string;
  payment_method: string | null;
  created_at: string;
};

type CourseItemRow = {
  id: string;
  order_id: string;
  course_session_id: string;
  quantity: number;
  unit_price: number | string | null;
  subtotal: number | string | null;
  courses?: { title?: string | null } | null;
  course_sessions?: { starts_at?: string | null } | null;
  course_participants?: Array<{ full_name?: string | null }> | null;
};

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "approved", label: "Aprobado" },
  { value: "pending", label: "Pendiente" },
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "in_process", label: "En proceso" },
  { value: "cancelled", label: "Cancelado" },
  { value: "rejected", label: "Rechazado" },
  { value: "expired", label: "Expirado" },
];

function normalizeStatus(rawStatus: string | null | undefined) {
  const normalized = rawStatus?.trim().toLowerCase() ?? "unknown";

  if (normalized === "approved") return "Aprobado";
  if (normalized === "pending" || normalized === "in_process" || normalized === "in_mediation") return "Pendiente";
  if (normalized === "pending_payment") return "Pendiente de pago";
  if (normalized === "cancelled") return "Cancelado";
  if (normalized === "rejected" || normalized === "charged_back" || normalized === "refunded") return "Rechazado";
  if (normalized === "expired") return "Expirado";

  return normalized === "unknown" ? "Sin estado" : normalized;
}

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPaymentMethod(rawValue: string | null | undefined) {
  if (!rawValue) return "Sin método";
  return rawValue.replace(/[_-]+/g, " ").trim();
}

function formatOrderItemsSummary(order: OrderRow, courseItems: CourseItemRow[]) {
  const productNames =
    order.metadata?.mixed_items_summary?.products
      ?.map((product) => product.name?.trim())
      .filter((name): name is string => Boolean(name)) ?? [];

  const courseNames = courseItems
    .map((course) => course.courses?.title?.trim())
    .filter((name): name is string => Boolean(name));

  const merged = [...new Set([...productNames, ...courseNames])];
  if (merged.length === 0) return "Sin ítems";
  if (merged.length <= 2) return merged.join(", ");
  return `${merged.slice(0, 2).join(", ")} +${merged.length - 2}`;
}

function getFallbackCourseBySession(order: OrderRow, sessionId: string) {
  const courses = order.metadata?.mixed_items_summary?.courses;

  if (!Array.isArray(courses)) {
    return null;
  }

  return courses.find((course) => (course.course_session_id ?? "") === sessionId) ?? null;
}

async function supabaseUserRead<T>(path: string, accessToken: string): Promise<{ data: T | null; error: string | null }> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const response = await fetch(`${supabaseUrl}${path}`, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Client-Info": getSupabaseClientInfoHeader(),
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as { message?: string } | T | null;

  if (!response.ok) {
    return {
      data: null,
      error: (body as { message?: string } | null)?.message ?? `Supabase error: ${response.status}`,
    };
  }

  return {
    data: body as T,
    error: null,
  };
}

export default async function AccountOrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const statusFilter = (resolvedSearchParams.status ?? "all").trim().toLowerCase();
  const referenceQuery = (resolvedSearchParams.q ?? "").trim();

  const { accessToken } = await getServerSessionTokens();
  const user = await getUserFromAccessToken(accessToken);

  if (!user || !accessToken) {
    redirect("/login?redirect=/mi-cuenta/pedidos");
  }

  const isSupportedStatus = STATUS_OPTIONS.some((option) => option.value === statusFilter);
  const sanitizedStatus = isSupportedStatus ? statusFilter : "all";

  const orderQueryParams = new URLSearchParams();
  orderQueryParams.set("select", "id,external_reference,status,total_amount,created_at,metadata");
  orderQueryParams.set("user_id", `eq.${user.id}`);
  orderQueryParams.set("order", "created_at.desc");

  if (sanitizedStatus !== "all") {
    orderQueryParams.set("status", `eq.${sanitizedStatus}`);
  }

  if (referenceQuery) {
    orderQueryParams.set("external_reference", `ilike.*${referenceQuery.replace(/\*/g, "")}*`);
  }

  const ordersResult = await supabaseUserRead<OrderRow[]>(`/rest/v1/orders?${orderQueryParams.toString()}`, accessToken);

  if (ordersResult.error) {
    return (
      <SiteShell eyebrow="Mi cuenta" title="Mis pedidos" subtitle="No fue posible cargar tu historial por el momento.">
        <div className="studio-card">
          <p>{ordersResult.error}</p>
        </div>
      </SiteShell>
    );
  }

  const orders = ordersResult.data ?? [];

  const orderIds = orders.map((order) => order.id);
  let paymentsByOrder = new Map<string, PaymentRow>();
  let courseItemsByOrder = new Map<string, CourseItemRow[]>();

  if (orderIds.length > 0) {
    const idsFilter = orderIds.map((id) => `"${id}"`).join(",");

    const [paymentsResult, courseItemsResult] = await Promise.all([
      supabaseUserRead<PaymentRow[]>(
        `/rest/v1/payments?select=order_id,payment_method,created_at&order_id=in.(${encodeURIComponent(idsFilter)})&order=created_at.desc`,
        accessToken,
      ),
      supabaseUserRead<CourseItemRow[]>(
        `/rest/v1/order_course_items?select=id,order_id,course_session_id,quantity,unit_price,subtotal,courses(title),course_sessions(starts_at),course_participants(full_name)&order_id=in.(${encodeURIComponent(
          idsFilter,
        )})&order=created_at.asc`,
        accessToken,
      ),
    ]);

    if (!paymentsResult.error && paymentsResult.data) {
      paymentsByOrder = new Map<string, PaymentRow>();
      for (const payment of paymentsResult.data) {
        if (!paymentsByOrder.has(payment.order_id)) {
          paymentsByOrder.set(payment.order_id, payment);
        }
      }
    }

    if (!courseItemsResult.error && courseItemsResult.data) {
      courseItemsByOrder = courseItemsResult.data.reduce((acc, item) => {
        const current = acc.get(item.order_id) ?? [];
        current.push(item);
        acc.set(item.order_id, current);
        return acc;
      }, new Map<string, CourseItemRow[]>());
    }
  }

  return (
    <SiteShell
      eyebrow="Mi cuenta"
      title="Mis pedidos"
      subtitle="Consulta tu historial con detalle de productos, cursos, método de pago y participantes registrados."
    >
      <form className="studio-form compact-form" method="GET">
        <label>
          Buscar por referencia
          <input className="input" type="search" name="q" placeholder="Ej. ritual-1234abcd" defaultValue={referenceQuery} />
        </label>

        <label>
          Filtrar por estado
          <select className="input" name="status" defaultValue={sanitizedStatus}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="cta-row">
          <button type="submit" className="btn btn-primary">
            Aplicar filtros
          </button>
        </div>
      </form>

      <div style={{ marginTop: "1.25rem" }}>
        {orders.length === 0 ? (
          <article className="studio-card">
            <p className="card-label">Sin resultados</p>
            <h2>No encontramos pedidos con esos filtros</h2>
            <p>Ajusta el estado o la referencia para volver a consultar.</p>
          </article>
        ) : null}

        {orders.length > 0 ? (
          <div className="orders-table-card">
            <div className="orders-table-head" aria-hidden="true">
              <span>Referencia</span>
              <span>Fecha</span>
              <span>Estado</span>
              <span>Total</span>
              <span>Ítems</span>
            </div>
            <div className="orders-table-body">
              {orders.map((order) => {
                const payment = paymentsByOrder.get(order.id);
                const courseItems = courseItemsByOrder.get(order.id) ?? [];
                const products = order.metadata?.mixed_items_summary?.products ?? [];
                const itemsSummary = formatOrderItemsSummary(order, courseItems);

                return (
                  <details className="orders-table-row" key={order.id}>
                    <summary>
                      <span className="order-reference">{order.external_reference}</span>
                      <span>{formatDateTime(order.created_at)}</span>
                      <span>{normalizeStatus(order.status)}</span>
                      <span>{formatMoney(order.total_amount)}</span>
                      <span>{itemsSummary}</span>
                    </summary>

                    <div className="orders-table-details">
                      <ul className="checkout-success-summary" style={{ listStyle: "none", padding: 0 }}>
                        <li>
                          <span>Método de pago</span>
                          <strong>{formatPaymentMethod(payment?.payment_method)}</strong>
                        </li>
                      </ul>

                      {products.length > 0 ? (
                        <div>
                          <p className="card-label" style={{ marginTop: "1rem" }}>
                            Productos
                          </p>
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
                                {products.map((product, index) => (
                                  <tr key={`${order.id}-product-${product.slug ?? index}`}>
                                    <td>{product.name ?? product.slug ?? "Producto"}</td>
                                    <td>{product.quantity ?? 0}</td>
                                    <td>{formatMoney(product.unitPrice)}</td>
                                    <td>{formatMoney(product.subtotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}

                      {courseItems.length > 0 ? (
                        <div>
                          <p className="card-label" style={{ marginTop: "1rem" }}>
                            Cursos
                          </p>
                          {courseItems.map((courseItem) => {
                            const fallback = getFallbackCourseBySession(order, courseItem.course_session_id);
                            const participants = (courseItem.course_participants ?? [])
                              .map((participant) => participant.full_name?.trim())
                              .filter((name): name is string => Boolean(name));

                            const title = courseItem.courses?.title ?? fallback?.name ?? "Curso";
                            const sessionDate = courseItem.course_sessions?.starts_at ?? fallback?.session_starts_at ?? null;

                            return (
                              <div key={courseItem.id} className="studio-card" style={{ marginTop: "0.8rem" }}>
                                <h3>{title}</h3>
                                <p>
                                  <strong>Sesión:</strong> {formatDateTime(sessionDate)}
                                </p>
                                <p>
                                  <strong>Cantidad:</strong> {courseItem.quantity}
                                </p>
                                <p>
                                  <strong>Subtotal:</strong> {formatMoney(courseItem.subtotal)}
                                </p>
                                <p>
                                  <strong>Participantes registrados:</strong>{" "}
                                  {participants.length ? participants.join(", ") : "Sin participantes"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </SiteShell>
  );
}
