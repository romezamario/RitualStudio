import SiteShell from "@/components/site-shell";
import { getMercadoPagoAccessTokenByEnvironment, mpApiFetch } from "@/lib/mercadopago";
import { getPaymentMode, setPaymentMode } from "@/lib/payment-mode";
import { supabaseAdminRequest } from "@/lib/supabase-admin";
import { getCurrentUserProfile, isSuperuserProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type AdminPaymentLookup = {
  payment?: Record<string, unknown> | null;
  order?: Record<string, unknown> | null;
  webhookEvents: Array<{ id: string; type?: string | null; action?: string | null; created_at?: string | null; payload?: Record<string, unknown> | null }>;
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

async function lookupPaymentVerification(mode: "prod" | "test", query: string): Promise<AdminPaymentLookup> {
  const token = getMercadoPagoAccessTokenByEnvironment(mode);
  if (!token) return { webhookEvents: [], error: `Falta MP_ACCESS_TOKEN_${mode === "test" ? "TEST" : "PROD"}.` };

  const trimmed = query.trim();
  if (!trimmed) return { webhookEvents: [] };

  try {
    let payment: Record<string, unknown> | null = null;
    let order: Record<string, unknown> | null = null;

    if (/^\d+$/.test(trimmed)) {
      payment = await mpApiFetch(`/v1/payments/${trimmed}`, token);
    }

    if (!payment) {
      const search = await mpApiFetch(`/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(trimmed)}&limit=1`, token);
      const results = Array.isArray((search as { results?: unknown[] }).results) ? (search as { results: unknown[] }).results : [];
      payment = (results[0] as Record<string, unknown> | undefined) ?? null;
    }

    const orderId = payment?.order && typeof payment.order === "object" ? (payment.order as { id?: string | number }).id : null;
    if (orderId) {
      order = await mpApiFetch(`/merchant_orders/${String(orderId)}`, token);
    }

    const paymentId = payment?.id ? String(payment.id) : null;
    const mpOrderId = orderId ? String(orderId) : null;
    const filters = [
      paymentId ? `payload->reconciliation->payment_id=eq.${encodeURIComponent(paymentId)}` : null,
      mpOrderId ? `payload->reconciliation->mercado_pago_order_id=eq.${encodeURIComponent(mpOrderId)}` : null,
    ].filter(Boolean);

    const queryPath = filters.length
      ? `/rest/v1/payment_events?select=id,type,action,created_at,payload&or=(${filters.join(",")})&order=created_at.desc&limit=5`
      : "/rest/v1/payment_events?select=id,type,action,created_at,payload&limit=0";

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
  searchParams?: Promise<{ q?: string }>;
}) {
  const { user, isAdmin, profile } = await getCurrentUserProfile();

  if (!user || !isAdmin) {
    redirect("/unauthorized");
  }

  const currentMode = await getPaymentMode();
  const isSuperuser = isSuperuserProfile(profile);
  const params = searchParams ? await searchParams : undefined;
  const lookupQuery = params?.q?.trim() ?? "";
  const verification = lookupQuery ? await lookupPaymentVerification(currentMode, lookupQuery) : null;

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
    </SiteShell>
  );
}
