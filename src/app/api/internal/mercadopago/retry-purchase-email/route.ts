import { NextResponse } from "next/server";
import { sendPurchaseConfirmationEmail } from "@/lib/email";
import { supabaseAdminRequest } from "@/lib/supabase-admin";

type OrderRecord = {
  id: string;
  external_reference?: string | null;
  customer_email?: string | null;
  total_amount?: number | string | null;
  metadata?: {
    items?: Array<{ name?: string; slug?: string; quantity?: number; unitPrice?: number; subtotal?: number }>;
    email_confirmation?: {
      attempts?: number;
      next_retry_at?: string;
      status?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null;
};

const MAX_ATTEMPTS = 5;
const BASE_RETRY_SECONDS = 300;

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value ?? 0) || 0;
}

function computeNextRetry(attempts: number): string {
  const delaySeconds = Math.min(BASE_RETRY_SECONDS * 2 ** Math.max(attempts - 1, 0), 6 * 60 * 60);
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.MP_EMAIL_RETRY_SECRET?.trim();
  if (!expected) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${expected}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const query = `/rest/v1/orders?select=id,external_reference,customer_email,total_amount,metadata,payment_confirmation_email_sent_at,status&status=eq.approved&payment_confirmation_email_sent_at=is.null&metadata->email_confirmation->>status=eq.pending_email_retry&metadata->email_confirmation->>next_retry_at=lte.${encodeURIComponent(now)}&limit=25`;
  const { data: orders, error } = await supabaseAdminRequest<(OrderRecord & { payment_confirmation_email_sent_at?: string | null; status?: string | null })[]>(query, {
    method: "GET",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "query_failed", details: error }, { status: 500 });
  }

  const results: Array<{ orderId: string; outcome: string }> = [];

  for (const order of orders ?? []) {
    const attempts = Number(order.metadata?.email_confirmation?.attempts ?? 0);
    const customerEmail = order.customer_email?.trim();
    const externalReference = order.external_reference?.trim();
    const items = Array.isArray(order.metadata?.items) ? order.metadata.items : [];

    const baseEmailConfirmation = {
      ...(order.metadata?.email_confirmation ?? {}),
      attempts: attempts + 1,
      last_attempt_at: new Date().toISOString(),
    } as Record<string, unknown>;

    if (attempts + 1 >= MAX_ATTEMPTS) {
      baseEmailConfirmation.status = "failed_final";
      baseEmailConfirmation.error = "Se alcanzó el máximo de reintentos para confirmación por email.";
      baseEmailConfirmation.next_retry_at = null;

      const { error: updateError } = await supabaseAdminRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ metadata: { ...(order.metadata ?? {}), email_confirmation: baseEmailConfirmation } }),
      });
      results.push({ orderId: order.id, outcome: updateError ? "update_failed" : "failed_final" });
      continue;
    }

    if (!customerEmail || !externalReference || !items.length) {
      baseEmailConfirmation.status = "pending_email_retry";
      baseEmailConfirmation.error = "Datos incompletos para enviar email de confirmación.";
      baseEmailConfirmation.next_retry_at = computeNextRetry(attempts + 1);

      await supabaseAdminRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ metadata: { ...(order.metadata ?? {}), email_confirmation: baseEmailConfirmation } }),
      });
      results.push({ orderId: order.id, outcome: "missing_data_retry_scheduled" });
      continue;
    }

    const sendResult = await sendPurchaseConfirmationEmail({
      to: customerEmail,
      externalReference,
      paymentId: "pending-from-webhook",
      paidAt: new Date().toISOString(),
      totalAmount: toNumber(order.total_amount),
      items: items.map((item) => ({
        name: item.name ?? item.slug ?? "Producto",
        quantity: Number.isFinite(item.quantity) ? Number(item.quantity) : 0,
        unitPrice: Number.isFinite(item.unitPrice) ? Number(item.unitPrice) : 0,
        subtotal: Number.isFinite(item.subtotal) ? Number(item.subtotal) : 0,
      })),
    });

    const emailConfirmation = sendResult.ok
      ? {
          ...baseEmailConfirmation,
          sent: true,
          sent_at: new Date().toISOString(),
          provider: sendResult.provider,
          message_id: sendResult.messageId,
          status: sendResult.skipped ? "skipped" : "sent",
          error: null,
          next_retry_at: null,
        }
      : {
          ...baseEmailConfirmation,
          sent: false,
          provider: sendResult.provider,
          status: "pending_email_retry",
          error: sendResult.error ?? "No fue posible enviar el correo de confirmación.",
          next_retry_at: computeNextRetry(attempts + 1),
        };

    await supabaseAdminRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}&status=eq.approved`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        metadata: { ...(order.metadata ?? {}), email_confirmation: emailConfirmation },
        payment_confirmation_email_sent_at: sendResult.ok ? new Date().toISOString() : null,
      }),
    });

    results.push({ orderId: order.id, outcome: sendResult.ok ? "sent" : "retry_scheduled" });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
