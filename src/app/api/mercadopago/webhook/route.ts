import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sendPurchaseConfirmationEmail } from "@/lib/email";
import {
  getMercadoPagoAccessTokenByEnvironment,
  getMercadoPagoWebhookSecretByEnvironment,
  mpApiFetch,
} from "@/lib/mercadopago";
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

type OrderCourseItemRecord = {
  id: string;
  course_session_id: string;
  quantity: number;
  metadata?: Record<string, unknown> | null;
};

type PaymentEventRow = {
  id?: string;
  event_key?: string;
  payload?: Record<string, unknown> | null;
};

const COURSE_CAPACITY_RELEASE_STATUSES = new Set(["rejected", "cancelled", "expired"]);
const FINAL_PAYMENT_STATUSES = new Set(["approved", "rejected", "cancelled", "expired"]);

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
  environment,
}: {
  rawBody: string;
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | undefined;
  environment: "prod" | "test";
}) {
  const secret = getMercadoPagoWebhookSecretByEnvironment(environment);

  if (!secret) {
    return { validated: false, reason: "missing-secret" };
  }

  if (!signatureHeader || !requestId || !dataId) {
    return { validated: false, reason: "missing-headers" };
  }

  const normalizedDataId = /[a-z0-9]/i.test(dataId) ? dataId.toLowerCase() : dataId;

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

  const manifest = `id:${normalizedDataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  if (!secureCompare(expected, v1)) {
    const fallback = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    if (!secureCompare(fallback, v1)) {
      return { validated: false, reason: "signature-mismatch" };
    }
  }

  return {
    validated: true,
    reason: "ok",
    dataIdOriginal: dataId,
    dataIdNormalized: normalizedDataId,
  };
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
      order_id: existingOrder?.id ?? null,
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
    order_id: existingOrder?.id ?? null,
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

function normalizePaymentStatus(status: string | null | undefined) {
  return (status ?? "").trim().toLowerCase();
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

async function fetchOrderCourseItems(orderId: string) {
  const { data, error } = await supabaseAdminRequest<OrderCourseItemRecord[]>(
    `/rest/v1/order_course_items?select=id,course_session_id,quantity,metadata&order_id=eq.${encodeURIComponent(orderId)}`
  );

  if (error) {
    console.error("[MP webhook] Error consultando order_course_items:", error);
    return [];
  }

  return data ?? [];
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

async function releaseCourseCapacityByOrderId(orderId: string, reason: string) {
  const { error } = await supabaseAdminRequest<unknown[]>("/rest/v1/rpc/release_course_capacity_for_order", {
    method: "POST",
    body: JSON.stringify({
      p_order_id: orderId,
      p_reason: reason,
    }),
  });

  if (error) {
    console.error("[MP webhook] No se pudo liberar cupo de curso:", error);
  }
}

async function confirmCourseCapacityForOrder(items: OrderCourseItemRecord[], reason: string) {
  for (const item of items) {
    const mergedMetadata = {
      ...(item.metadata ?? {}),
      capacity_confirmed: true,
      capacity_confirmed_reason: reason,
      capacity_confirmed_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdminRequest<unknown[]>(
      `/rest/v1/order_course_items?id=eq.${encodeURIComponent(item.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          metadata: mergedMetadata,
        }),
      }
    );

    if (error) {
      console.error("[MP webhook] No se pudo confirmar metadata de cupo:", error);
    }
  }
}

async function findPaymentEventByEventKey(eventKey: string) {
  const { data, error } = await supabaseAdminRequest<PaymentEventRow[]>(
    `/rest/v1/payment_events?select=id,event_key,payload&event_key=eq.${encodeURIComponent(eventKey)}&limit=1`
  );

  if (error) {
    console.error("[MP webhook] Error consultando payment_events por event_key:", error);
    return null;
  }

  return data?.[0] ?? null;
}

async function updatePaymentEventPayload(eventKey: string, payload: Record<string, unknown>) {
  const { error } = await supabaseAdminRequest<unknown[]>(
    `/rest/v1/payment_events?event_key=eq.${encodeURIComponent(eventKey)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        payload,
      }),
    }
  );

  if (error) {
    console.error("[MP webhook] Error actualizando payment_events.payload:", error);
  }
}

async function reconcileCourseCapacityForFinalStatus({
  mercadoPagoOrderId,
  paymentStatus,
  source,
}: {
  mercadoPagoOrderId: string;
  paymentStatus: string;
  source: "payment" | "order";
}) {
  const normalizedStatus = normalizePaymentStatus(paymentStatus);

  if (!mercadoPagoOrderId || !FINAL_PAYMENT_STATUSES.has(normalizedStatus)) {
    return {
      foundOrder: false,
      orderId: null,
      orderCourseItemsCount: 0,
      action: "ignored-non-final-status",
      reason: `webhook-${source}-${normalizedStatus || "unknown"}`,
    };
  }

  const order = await fetchOrderByMercadoPagoOrderId(mercadoPagoOrderId);

  if (!order?.id) {
    return {
      foundOrder: false,
      orderId: null,
      orderCourseItemsCount: 0,
      action: "missing-order",
      reason: `webhook-${source}-${normalizedStatus}`,
    };
  }

  const orderCourseItems = await fetchOrderCourseItems(order.id);

  if (!orderCourseItems.length) {
    return {
      foundOrder: true,
      orderId: order.id,
      orderCourseItemsCount: 0,
      action: "order-without-course-items",
      reason: `webhook-${source}-${normalizedStatus}`,
    };
  }

  const reason = `webhook-${source}-${normalizedStatus}`;

  if (normalizedStatus === "approved") {
    await confirmCourseCapacityForOrder(orderCourseItems, reason);

    return {
      foundOrder: true,
      orderId: order.id,
      orderCourseItemsCount: orderCourseItems.length,
      action: "capacity-confirmed",
      reason,
    };
  }

  if (COURSE_CAPACITY_RELEASE_STATUSES.has(normalizedStatus)) {
    await releaseCourseCapacityByOrderId(order.id, reason);

    return {
      foundOrder: true,
      orderId: order.id,
      orderCourseItemsCount: orderCourseItems.length,
      action: "capacity-release-requested",
      reason,
    };
  }

  return {
    foundOrder: true,
    orderId: order.id,
    orderCourseItemsCount: orderCourseItems.length,
    action: "final-status-without-capacity-action",
    reason,
  };
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

type WebhookFailurePolicy = "mp-retry-5xx" | "internal-retry-200" | "non-retryable-200";

function classifyWebhookFailure(error: unknown): {
  policy: WebhookFailurePolicy;
  reason: string;
} {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("no se pudo registrar evento en payment_events") || message.includes("payment_events")) {
    return {
      policy: "mp-retry-5xx",
      reason: "No se pudo persistir auditoría mínima del webhook en payment_events.",
    };
  }

  if (message.includes("json") || message.includes("signature")) {
    return {
      policy: "non-retryable-200",
      reason: "Payload o firma inválida; un reintento de MP no corrige este tipo de error.",
    };
  }

  return {
    policy: "internal-retry-200",
    reason: "Falla transitoria de sincronización/reconciliación backend; se programa reproceso interno.",
  };
}

export async function handleWebhook(request: Request, environment: "prod" | "test" = "prod") {
  const rawBody = await request.text();
  let payload: WebhookPayload = {};

  try {
    payload = (JSON.parse(rawBody || "{}") ?? {}) as WebhookPayload;
  } catch {
    return NextResponse.json({ ok: true, ignored: "invalid-json" });
  }

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  const signature = validateMercadoPagoSignature({
    rawBody,
    signatureHeader,
    requestId,
    dataId: payload.data?.id,
    environment,
  });
  const accessToken = getMercadoPagoAccessTokenByEnvironment(environment);

  const normalizedEventDataId =
    payload.data?.id && /[a-z0-9]/i.test(payload.data.id) ? payload.data.id.toLowerCase() : payload.data?.id;
  const eventKey = `${payload.type ?? "unknown"}:${normalizedEventDataId ?? "na"}:${payload.action ?? "na"}`;
  const existingEvent = await findPaymentEventByEventKey(eventKey);
  const alreadyProcessed = existingEvent?.payload?.webhook_processing
    ? (existingEvent.payload.webhook_processing as Record<string, unknown>).processed === true
    : false;

  if (alreadyProcessed) {
    const duplicatePayload = {
      ...(existingEvent?.payload ?? {}),
      duplicate_notifications: Number(existingEvent?.payload?.duplicate_notifications ?? 0) + 1,
      last_duplicate_at: new Date().toISOString(),
    };

    await updatePaymentEventPayload(eventKey, duplicatePayload);
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  const initialPayload = {
    webhook_notification: payload,
    signature: {
      valid: signature.validated,
      reason: signature.reason,
      request_id: requestId,
      data_id_original: payload.data?.id ?? null,
      data_id_normalized:
        "dataIdNormalized" in signature ? (signature.dataIdNormalized ?? null) : (normalizedEventDataId ?? null),
    },
    webhook_processing: {
      processed: false,
      started_at: new Date().toISOString(),
      idempotency_key: eventKey,
    },
    duplicate_notifications: Number(existingEvent?.payload?.duplicate_notifications ?? 0),
  };

  const eventRow = {
    event_key: eventKey,
    mercado_pago_event_id: payload.id ? String(payload.id) : null,
    type: payload.type ?? null,
    action: payload.action ?? null,
    payload: initialPayload,
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
    return NextResponse.json({ ok: false, retry: "mercadopago", reason: "payment_event_persist_failed" }, { status: 500 });
  }

  let audit: Record<string, unknown> = {
    topic: payload.type ?? payload.action ?? "",
    data_id: payload.data?.id ?? null,
    finalized_at: null,
    reconciliations: [],
  };

  try {
    const topic = payload.type ?? payload.action ?? "";
    const dataId = payload.data?.id;

    if (dataId && topic.includes("payment")) {
      const payment = await mpApiFetch<MpPaymentResponse>(`/v1/payments/${dataId}`, {
        method: "GET",
        accessToken,
      });

      await upsertOrderFromPayment(payment);

      const paymentStatus = normalizePaymentStatus(payment.status);
      const mercadoPagoOrderId = payment.order?.id ? String(payment.order.id) : "";

      if (mercadoPagoOrderId && FINAL_PAYMENT_STATUSES.has(paymentStatus)) {
        const reconciliation = await reconcileCourseCapacityForFinalStatus({
          mercadoPagoOrderId,
          paymentStatus,
          source: "payment",
        });

        audit = {
          ...audit,
          payment_snapshot: {
            payment_id: payment.id ?? null,
            status: payment.status ?? null,
            status_detail: payment.status_detail ?? null,
            mercado_pago_order_id: mercadoPagoOrderId || null,
          },
          reconciliations: [...((audit.reconciliations as unknown[]) ?? []), reconciliation],
        };
      }

      await trySendPurchaseEmail({ payment, fallbackPaidAt: payload.date_created });
    }

    if (dataId && topic.includes("order")) {
      const order = await mpApiFetch<MpOrderResponse>(`/v1/orders/${dataId}`, {
        method: "GET",
        accessToken,
      });

      await upsertOrderFromMpOrder(order);

      const orderPaymentStatus = normalizePaymentStatus(order.transactions?.payments?.[0]?.status ?? order.status);
      const mercadoPagoOrderId = order.id ? String(order.id) : "";

      if (mercadoPagoOrderId && FINAL_PAYMENT_STATUSES.has(orderPaymentStatus)) {
        const reconciliation = await reconcileCourseCapacityForFinalStatus({
          mercadoPagoOrderId,
          paymentStatus: orderPaymentStatus,
          source: "order",
        });

        audit = {
          ...audit,
          order_snapshot: {
            mercado_pago_order_id: mercadoPagoOrderId,
            status: order.status ?? null,
            payment_status: order.transactions?.payments?.[0]?.status ?? null,
            status_detail: order.status_detail ?? null,
          },
          reconciliations: [...((audit.reconciliations as unknown[]) ?? []), reconciliation],
        };
      }
    }
  } catch (error) {
    console.error("[MP webhook] Error al reconciliar datos con Mercado Pago:", error);

    const classification = classifyWebhookFailure(error);
    const failedAt = new Date().toISOString();
    const failedPayload = {
      ...initialPayload,
      webhook_processing: {
        ...(initialPayload.webhook_processing ?? {}),
        processed: false,
        status:
          classification.policy === "internal-retry-200"
            ? "pending_internal_retry"
            : classification.policy === "mp-retry-5xx"
              ? "waiting_mp_retry"
              : "failed_non_retryable",
        retry_policy: classification.policy,
        failed_at: failedAt,
        error: error instanceof Error ? error.message : "Error desconocido en webhook.",
        retry_after_seconds: classification.policy === "internal-retry-200" ? 60 : null,
      },
      operational_alert: {
        required: classification.policy !== "non-retryable-200",
        severity: classification.policy === "mp-retry-5xx" ? "critical" : "high",
        reason: classification.reason,
        created_at: failedAt,
      },
      audit,
    };

    await updatePaymentEventPayload(eventKey, failedPayload);

    if (classification.policy === "mp-retry-5xx") {
      return NextResponse.json({ ok: false, retry: "mercadopago" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, retry: classification.policy === "internal-retry-200" ? "internal" : "none" });
  }

  const finalizedPayload = {
    ...initialPayload,
    webhook_processing: {
      ...(initialPayload.webhook_processing ?? {}),
      processed: true,
      status: "completed",
      retry_policy: "none",
      finished_at: new Date().toISOString(),
    },
    audit: {
      ...audit,
      finalized_at: new Date().toISOString(),
    },
  };

  await updatePaymentEventPayload(eventKey, finalizedPayload);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Webhook Mercado Pago activo.",
    endpoints: ["/api/mercadopago/webhook/prod", "/api/mercadopago/webhook/test"],
  });
}

export async function POST(request: Request) {
  return handleWebhook(request, "prod");
}
