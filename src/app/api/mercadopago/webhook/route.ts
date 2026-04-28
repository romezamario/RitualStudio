import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sendPurchaseConfirmationEmail } from "@/lib/email";
import { mpApiFetch, getMercadoPagoWebhookSecret } from "@/lib/mercadopago";
import { supabaseAdminRequest } from "@/lib/supabase-admin";

type WebhookPayload = {
  action?: string;
  api_version?: string;
  data?: {
    id?: string;
  };
  date_created?: string;
  id?: number;
  live_mode?: boolean;
  type?: string;
  user_id?: string;
  [key: string]: unknown;
};

type MpPaymentResponse = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  payment_method_id?: string;
  transaction_amount?: number;
  order?: { id?: string | number };
  [key: string]: unknown;
};

type OrderMetadata = {
  source?: string;
  status_detail?: string | null;
  items?: Array<{
    slug?: string;
    name?: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
  email_confirmation?: {
    sent?: boolean;
    sent_at?: string;
    provider?: string;
    message_id?: string;
    skipped?: boolean;
    error?: string;
    attempts?: number;
    last_attempt_at?: string;
  };
  [key: string]: unknown;
};

type OrderRecord = {
  id?: string;
  external_reference?: string | null;
  mercado_pago_order_id?: string | null;
  customer_email?: string | null;
  total_amount?: number | string | null;
  metadata?: OrderMetadata | null;
  created_at?: string | null;
};

const COURSE_CAPACITY_RELEASE_STATUSES = new Set(["rejected", "cancelled"]);

type MpOrderResponse = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  payer?: { email?: string };
  total_amount?: number;
  transactions?: {
    payments?: Array<{
      id?: string | number;
      status?: string;
      status_detail?: string;
      amount?: number;
      payment_method?: { id?: string };
    }>;
  };
  [key: string]: unknown;
};

function secureCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function validateMercadoPagoSignature({
  rawBody,
  signatureHeader,
  requestId,
  dataId,
}: {
  rawBody: string;
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | undefined;
}) {
  const secret = getMercadoPagoWebhookSecret();

  if (!secret) {
    return { validated: false, reason: "missing-secret" };
  }

  if (!signatureHeader || !requestId || !dataId) {
    return { validated: false, reason: "missing-headers" };
  }

  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");

    if (key && value) {
      acc[key.trim()] = value.trim();
    }

    return acc;
  }, {});

  const ts = parts.ts;
  const v1 = parts.v1;

  if (!ts || !v1) {
    return { validated: false, reason: "invalid-signature-format" };
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  if (!secureCompare(expected, v1)) {
    const fallback = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    if (!secureCompare(fallback, v1)) {
      return { validated: false, reason: "signature-mismatch" };
    }
  }

  return { validated: true, reason: "ok" };
}

async function upsertOrderFromMpOrder(order: MpOrderResponse) {
  const payment = order.transactions?.payments?.[0];
  const existingOrder = await fetchOrderByMercadoPagoOrderId(order.id ? String(order.id) : "");
  const mergedMetadata = mergeOrderMetadata(existingOrder?.metadata, {
    source: "mercadopago-webhook",
    status_detail: payment?.status_detail ?? order.status_detail ?? null,
  });

  const orderRow = {
    mercado_pago_order_id: String(order.id ?? ""),
    status: payment?.status ?? order.status ?? "unknown",
    total_amount: payment?.amount ?? order.total_amount ?? null,
    customer_email: order.payer?.email ?? null,
    metadata: mergedMetadata,
    raw_response: order,
  };

  const { error } = await supabaseAdminRequest<unknown[]>("/rest/v1/orders?on_conflict=mercado_pago_order_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(orderRow),
  });

  if (error) {
    console.error("[MP webhook] Error upsert orders:", error);
  }

  if (payment?.id) {
    const paymentRow = {
      mercado_pago_payment_id: String(payment.id),
      mercado_pago_order_id: String(order.id ?? ""),
      status: payment.status ?? "unknown",
      status_detail: payment.status_detail ?? order.status_detail ?? null,
      payment_method: payment.payment_method?.id ?? null,
      amount: payment.amount ?? order.total_amount ?? null,
      raw_response: payment,
    };

    const { error: paymentError } = await supabaseAdminRequest<unknown[]>(
      "/rest/v1/payments?on_conflict=mercado_pago_payment_id",
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(paymentRow),
      }
    );

    if (paymentError) {
      console.error("[MP webhook] Error upsert payments:", paymentError);
    }
  }
}

async function upsertOrderFromPayment(payment: MpPaymentResponse) {
  const orderId = payment.order?.id;

  if (!orderId) {
    return;
  }

  const existingOrder = await fetchOrderByMercadoPagoOrderId(String(orderId));
  const mergedMetadata = mergeOrderMetadata(existingOrder?.metadata, {
    source: "mercadopago-webhook-payment",
    status_detail: payment.status_detail ?? null,
  });

  const orderRow = {
    mercado_pago_order_id: String(orderId),
    status: payment.status ?? "unknown",
    total_amount: payment.transaction_amount ?? null,
    metadata: mergedMetadata,
    raw_response: payment,
  };

  const { error } = await supabaseAdminRequest<unknown[]>("/rest/v1/orders?on_conflict=mercado_pago_order_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(orderRow),
  });

  if (error) {
    console.error("[MP webhook] Error upsert orders from payment:", error);
  }

  const paymentRow = {
    mercado_pago_payment_id: String(payment.id ?? ""),
    mercado_pago_order_id: String(orderId),
    status: payment.status ?? "unknown",
    status_detail: payment.status_detail ?? null,
    payment_method: payment.payment_method_id ?? null,
    amount: payment.transaction_amount ?? null,
    raw_response: payment,
  };

  const { error: paymentError } = await supabaseAdminRequest<unknown[]>(
    "/rest/v1/payments?on_conflict=mercado_pago_payment_id",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(paymentRow),
    }
  );

  if (paymentError) {
    console.error("[MP webhook] Error upsert payment row:", paymentError);
  }
}

function mergeOrderMetadata(existing: OrderMetadata | null | undefined, updates: OrderMetadata) {
  return {
    ...(existing ?? {}),
    ...updates,
    email_confirmation: {
      ...(existing?.email_confirmation ?? {}),
      ...(updates.email_confirmation ?? {}),
    },
  };
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchOrderByMercadoPagoOrderId(mercadoPagoOrderId: string) {
  if (!mercadoPagoOrderId) {
    return null;
  }

  const { data, error } = await supabaseAdminRequest<OrderRecord[]>(
    `/rest/v1/orders?select=id,external_reference,mercado_pago_order_id,customer_email,total_amount,metadata,created_at&mercado_pago_order_id=eq.${encodeURIComponent(
      mercadoPagoOrderId
    )}&order=created_at.desc&limit=1`
  );

  if (error) {
    console.error("[MP webhook] Error consultando orden por mercado_pago_order_id:", error);
    return null;
  }

  return data?.[0] ?? null;
}

async function persistEmailConfirmationMetadata(orderId: string, metadata: OrderMetadata) {
  const { error } = await supabaseAdminRequest<unknown[]>(
    `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        metadata,
      }),
    }
  );

  if (error) {
    console.error("[MP webhook] Error guardando metadata de email_confirmation:", error);
  }
}

async function releaseCourseCapacityByMercadoPagoOrderId(mercadoPagoOrderId: string, reason: string) {
  const order = await fetchOrderByMercadoPagoOrderId(mercadoPagoOrderId);

  if (!order?.id) {
    return;
  }

  const { error } = await supabaseAdminRequest<unknown[]>("/rest/v1/rpc/release_course_capacity_for_order", {
    method: "POST",
    body: JSON.stringify({
      p_order_id: order.id,
      p_reason: reason,
    }),
  });

  if (error) {
    console.error("[MP webhook] No se pudo liberar cupo de curso:", error);
  }
}

async function trySendPurchaseEmail({
  payment,
  fallbackPaidAt,
}: {
  payment: MpPaymentResponse;
  fallbackPaidAt?: string;
}) {
  if (payment.status !== "approved") {
    return;
  }

  const mercadoPagoOrderId = payment.order?.id ? String(payment.order.id) : "";
  const order = await fetchOrderByMercadoPagoOrderId(mercadoPagoOrderId);

  if (!order?.id) {
    console.warn("[MP webhook] No se encontró la orden para envío de comprobante:", mercadoPagoOrderId);
    return;
  }

  const emailAttempts = Number(order.metadata?.email_confirmation?.attempts ?? 0);
  const alreadySent = order.metadata?.email_confirmation?.sent === true;

  if (alreadySent) {
    return;
  }

  const customerEmail = order.customer_email?.trim();
  const externalReference = order.external_reference?.trim();
  const paymentId = payment.id != null ? String(payment.id) : "";
  const items = Array.isArray(order.metadata?.items) ? order.metadata.items : [];
  const paidAt = fallbackPaidAt ?? new Date().toISOString();

  if (!customerEmail || !externalReference || !paymentId || !items.length) {
    const failedMetadata = mergeOrderMetadata(order.metadata, {
      email_confirmation: {
        sent: false,
        error: "No se pudo enviar correo: faltan email, referencia, payment_id o items en metadata.",
        attempts: emailAttempts + 1,
        last_attempt_at: new Date().toISOString(),
      },
    });

    await persistEmailConfirmationMetadata(order.id, failedMetadata);
    return;
  }

  const sendResult = await sendPurchaseConfirmationEmail({
    to: customerEmail,
    externalReference,
    paymentId,
    paidAt,
    totalAmount: toNumber(payment.transaction_amount ?? order.total_amount),
    items: items.map((item) => ({
      name: item.name ?? item.slug ?? "Producto",
      quantity: Number.isFinite(item.quantity) ? Number(item.quantity) : 0,
      unitPrice: Number.isFinite(item.unitPrice) ? Number(item.unitPrice) : 0,
      subtotal: Number.isFinite(item.subtotal)
        ? Number(item.subtotal)
        : (Number.isFinite(item.quantity) ? Number(item.quantity) : 0) *
          (Number.isFinite(item.unitPrice) ? Number(item.unitPrice) : 0),
    })),
  });

  const nextMetadata = mergeOrderMetadata(order.metadata, {
    email_confirmation: sendResult.ok
      ? {
          sent: true,
          sent_at: new Date().toISOString(),
          provider: sendResult.provider,
          message_id: sendResult.messageId,
          skipped: sendResult.skipped ?? false,
          attempts: emailAttempts + 1,
          last_attempt_at: new Date().toISOString(),
          error: undefined,
        }
      : {
          sent: false,
          provider: sendResult.provider,
          error: sendResult.error ?? "No fue posible enviar el correo de confirmación.",
          attempts: emailAttempts + 1,
          last_attempt_at: new Date().toISOString(),
        },
  });

  await persistEmailConfirmationMetadata(order.id, nextMetadata);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const payload = (JSON.parse(rawBody || "{}") ?? {}) as WebhookPayload;

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  const signature = validateMercadoPagoSignature({
    rawBody,
    signatureHeader,
    requestId,
    dataId: payload.data?.id,
  });

  const eventKey = `${payload.type ?? "unknown"}:${payload.data?.id ?? "na"}:${payload.action ?? "na"}`;

  const eventRow = {
    event_key: eventKey,
    mercado_pago_event_id: payload.id ?? null,
    event_type: payload.type ?? null,
    action: payload.action ?? null,
    data_id: payload.data?.id ?? null,
    signature_valid: signature.validated,
    signature_reason: signature.reason,
    raw_payload: payload,
  };

  const { error: eventError } = await supabaseAdminRequest<unknown[]>("/rest/v1/payment_events?on_conflict=event_key", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(eventRow),
  });

  if (eventError) {
    console.error("[MP webhook] No se pudo registrar evento en payment_events:", eventError);
  }

  try {
    const topic = payload.type ?? payload.action ?? "";
    const dataId = payload.data?.id;

    if (dataId && topic.includes("payment")) {
      const payment = await mpApiFetch<MpPaymentResponse>(`/v1/payments/${dataId}`, {
        method: "GET",
      });
      await upsertOrderFromPayment(payment);
      const normalizedPaymentStatus = (payment.status ?? "").toLowerCase();

      if (payment.order?.id && COURSE_CAPACITY_RELEASE_STATUSES.has(normalizedPaymentStatus)) {
        await releaseCourseCapacityByMercadoPagoOrderId(
          String(payment.order.id),
          `webhook-payment-${normalizedPaymentStatus}`,
        );
      }

      await trySendPurchaseEmail({ payment, fallbackPaidAt: payload.date_created });
    }

    if (dataId && topic.includes("order")) {
      const order = await mpApiFetch<MpOrderResponse>(`/v1/orders/${dataId}`, {
        method: "GET",
      });
      await upsertOrderFromMpOrder(order);
    }
  } catch (error) {
    console.error("[MP webhook] Error al reconciliar datos con Mercado Pago:", error);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Webhook Mercado Pago activo." });
}
