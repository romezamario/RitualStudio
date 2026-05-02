import SiteShell from "@/components/site-shell";
import { getMercadoPagoAccessTokenByEnvironment, mpApiFetch } from "@/lib/mercadopago";
import { getPaymentMode, setPaymentMode } from "@/lib/payment-mode";
import { supabaseAdminRequest } from "@/lib/supabase-admin";
import { getCurrentUserProfile, isSuperuserProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDateTimeMx } from "@/lib/date-time";

type AdminRecentPayment = {
  id?: string | number;
  status?: string;
  date_created?: string;
  transaction_amount?: number;
  external_reference?: string;
  order?: { id?: string | number } | null;
};

type AdminPaymentLookup = {
  payment?: Record<string, unknown> | null;
  order?: Record<string, unknown> | null;
  webhookEvents: Array<{ id: string; type?: string | null; action?: string | null; received_at?: string | null; payload?: Record<string, unknown> | null }>;
  error?: string;
};

async function updatePaymentMode(formData: FormData) {
  "use server";

  const mode = formData.get("mode");
  const { user, profile, isAdmin } = await getCurrentUserProfile();

  if (!user || !isAdmin || !isSuperuserProfile(profile)) {
    throw new Error("No autorizado para cambiar el modo de pagos.");
  }

  if (mode !== "prod" && mode !== "test") {
    throw new Error("Modo inválido.");
  }

  const { error } = await setPaymentMode(mode);

  if (error) {
    throw new Error(`No fue posible actualizar el modo. ${error}`);
  }

  redirect("/admin/pagos");
}


async function listRecentPayments(mode: "prod" | "test", page: number): Promise<{ results: AdminRecentPayment[]; error?: string }> {
  const token = getMercadoPagoAccessTokenByEnvironment(mode);
  if (!token) return { results: [], error: `Falta MP_ACCESS_TOKEN_${mode === "test" ? "TEST" : "PROD"}.` };

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const offset = (safePage - 1) * 10;

  try {
    const response = await mpApiFetch(`/v1/payments/search?sort=date_created&criteria=desc&limit=10&offset=${offset}`, { accessToken: token, environment: mode });
    const results = Array.isArray((response as { results?: unknown[] }).results)
      ? ((response as { results: unknown[] }).results as AdminRecentPayment[])
      : [];

    return { results };
  } catch (error) {
    return {
      results: [],
      error: error instanceof Error ? error.message : "No fue posible obtener pagos recientes.",
    };
  }
}

async function lookupPaymentVerification(mode: "prod" | "test", query: string): Promise<AdminPaymentLookup> {
  const token = getMercadoPagoAccessTokenByEnvironment(mode);
  if (!token) return { webhookEvents: [], error: `Falta MP_ACCESS_TOKEN_${mode === "test" ? "TEST" : "PROD"}.` };

  const trimmed = query.trim();
  if (!trimmed) return { webhookEvents: [] };

  try {
    let payment: Record<string, unknown> | null = null;
    let order: Record<string, unknown> | null = null;

    if (/^\d+$/.test(trimmed)) {
      payment = await mpApiFetch(`/v1/payments/${trimmed}`, { accessToken: token, environment: mode });
    }

    if (!payment) {
      const search = await mpApiFetch(`/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(trimmed)}&limit=1`, { accessToken: token, environment: mode });
      const results = Array.isArray((search as { results?: unknown[] }).results) ? (search as { results: unknown[] }).results : [];
      payment = (results[0] as Record<string, unknown> | undefined) ?? null;
    }

    const orderId = payment?.order && typeof payment.order === "object" ? (payment.order as { id?: string | number }).id : null;
    if (orderId) {
      order = await mpApiFetch(`/merchant_orders/${String(orderId)}`, { accessToken: token, environment: mode });
    }

    const paymentId = payment?.id ? String(payment.id) : null;
    const mpOrderId = orderId ? String(orderId) : null;
    const filters = [
      paymentId ? `payload->reconciliation->payment_id=eq.${encodeURIComponent(paymentId)}` : null,
      mpOrderId ? `payload->reconciliation->mercado_pago_order_id=eq.${encodeURIComponent(mpOrderId)}` : null,
    ].filter(Boolean);

    const queryPath = filters.length
      ? `/rest/v1/payment_events?select=id,type,action,received_at,payload&or=(${filters.join(",")})&order=received_at.desc&limit=5`
      : "/rest/v1/payment_events?select=id,type,action,received_at,payload&limit=0";

    const { data, error } = await supabaseAdminRequest<AdminPaymentLookup["webhookEvents"]>(queryPath, { method: "GET" });

    return {
      payment,
      order,
      webhookEvents: error ? [] : data ?? [],
      error: error ?? undefined,
    };
  } catch (error) {
    return {
      webhookEvents: [],
      error: error instanceof Error ? error.message : "No fue posible verificar el pago.",
    };
  }
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; p?: string }>;
}) {
  const { user, isAdmin, profile } = await getCurrentUserProfile();

  if (!user || !isAdmin) {
    redirect("/unauthorized");
  }

  const currentMode = await getPaymentMode();
  const isSuperuser = isSuperuserProfile(profile);
  const params = searchParams ? await searchParams : undefined;
  const lookupQuery = params?.q?.trim() ?? "";
  const recentPaymentsPage = Number(params?.p ?? "1");
  const safeRecentPaymentsPage = Number.isFinite(recentPaymentsPage) && recentPaymentsPage > 0 ? Math.floor(recentPaymentsPage) : 1;
  const verification = lookupQuery ? await lookupPaymentVerification(currentMode, lookupQuery) : null;
  const recentPayments = await listRecentPayments(currentMode, safeRecentPaymentsPage);

  return (
    <SiteShell eyebrow="Administrador" title="Modo de pago y verificación" subtitle="Control de modo test/prod y verificación de pagos vía webhook de Mercado Pago.">
      <div className="studio-card">
        <p className="card-label">Estado actual</p>
        <h2>Modo activo: {currentMode === "test" ? "Pruebas" : "Producción"}</h2>
        <p>El modo activo define qué variables usa backend para checkout y notification_url: credenciales y webhook de test o producción.</p>
        <p>Solo superusuario puede cambiar este valor. Define usuarios superusuario en la variable<code> SUPERUSER_EMAILS</code> (lista separada por comas).</p>
        {isSuperuser ? (
          <form action={updatePaymentMode} className="studio-form" style={{ marginTop: 16 }}>
            <label htmlFor="mode">Selecciona el modo:</label>
            <select id="mode" name="mode" defaultValue={currentMode}>
              <option value="test">Pruebas (TEST)</option>
              <option value="prod">Producción (APP_USR)</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }}>Guardar modo de pagos</button>
          </form>
        ) : (
          <p className="form-hint">No tienes permisos de superusuario para cambiar el modo.</p>
        )}
      </div>

      <div className="studio-card" style={{ marginTop: 16 }}>
        <p className="card-label">Verificación de pagos</p>
        <h2>Buscar pago en modo {currentMode === "test" ? "Pruebas" : "Producción"}</h2>
        <p>La búsqueda usa las credenciales del modo activo para consultar Mercado Pago y mostrar trazas recientes del webhook.</p>
        <form method="GET" className="studio-form" style={{ marginTop: 16 }}>
          <label htmlFor="q">ID de pago o external_reference:</label>
          <input id="q" name="q" defaultValue={lookupQuery} placeholder="Ej: 123456789 o ritual-prod-..." />
          <button type="submit" className="btn" style={{ marginTop: 12 }}>Verificar pago</button>
        </form>

        {verification?.error ? <p className="form-hint" style={{ marginTop: 12 }}>{verification.error}</p> : null}
        {verification && !verification.error ? (
          <div style={{ marginTop: 12 }}>
            <p><strong>Pago:</strong> {verification.payment?.id ? String(verification.payment.id) : "No encontrado"}</p>
            <p><strong>Estado:</strong> {verification.payment?.status ? String(verification.payment.status) : "-"}</p>
            <p><strong>Order MP:</strong> {verification.order?.id ? String(verification.order.id) : "-"}</p>
            <p><strong>Eventos webhook (últimos 5):</strong> {verification.webhookEvents.length}</p>
          </div>
        ) : null}
      </div>

      <div className="studio-card" style={{ marginTop: 16 }}>
        <p className="card-label">Últimos pagos</p>
        <h2>Historial de pagos (10 por página)</h2>
        <p>Listado del más reciente al más antiguo según Mercado Pago usando el modo activo.</p>

        {recentPayments.error ? <p className="form-hint" style={{ marginTop: 12 }}>{recentPayments.error}</p> : null}

        {!recentPayments.error && recentPayments.results.length === 0 ? (
          <p style={{ marginTop: 12 }}>No se encontraron pagos en esta página.</p>
        ) : null}

        {recentPayments.results.length > 0 ? (
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Pago</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Estado</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Monto</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Fecha</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>External ref</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.results.map((payment, index) => (
                  <tr key={`${String(payment.id ?? "payment")}-${index}`}>
                    <td style={{ padding: "8px 4px" }}>{payment.id ? String(payment.id) : "-"}</td>
                    <td style={{ padding: "8px 4px" }}>{payment.status ?? "-"}</td>
                    <td style={{ padding: "8px 4px" }}>{typeof payment.transaction_amount === "number" ? payment.transaction_amount.toLocaleString("es-AR", { style: "currency", currency: "ARS" }) : "-"}</td>
                    <td style={{ padding: "8px 4px" }}>{payment.date_created ? formatDateTimeMx(payment.date_created) : "-"}</td>
                    <td style={{ padding: "8px 4px" }}>{payment.external_reference ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <a
                className="btn"
                aria-disabled={safeRecentPaymentsPage <= 1}
                href={safeRecentPaymentsPage <= 1 ? "#" : `/admin/pagos?p=${safeRecentPaymentsPage - 1}${lookupQuery ? `&q=${encodeURIComponent(lookupQuery)}` : ""}`}
                style={safeRecentPaymentsPage <= 1 ? { pointerEvents: "none", opacity: 0.5 } : undefined}
              >
                Anteriores 10
              </a>
              <a className="btn" href={`/admin/pagos?p=${safeRecentPaymentsPage + 1}${lookupQuery ? `&q=${encodeURIComponent(lookupQuery)}` : ""}`}>
                Siguientes 10
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </SiteShell>
  );
}
