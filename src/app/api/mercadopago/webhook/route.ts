import crypto from "node:crypto";
import { NextResponse } from "next/server";
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

  const orderRow = {
    mercado_pago_order_id: String(order.id ?? ""),
    status: payment?.status ?? order.status ?? "unknown",
    total_amount: payment?.amount ?? order.total_amount ?? null,
    customer_email: order.payer?.email ?? null,
    metadata: {
      source: "mercadopago-webhook",
      status_detail: payment?.status_detail ?? order.status_detail ?? null,
    },
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

  const orderRow = {
    mercado_pago_order_id: String(orderId),
    status: payment.status ?? "unknown",
    total_amount: payment.transaction_amount ?? null,
    metadata: {
      source: "mercadopago-webhook-payment",
      status_detail: payment.status_detail ?? null,
    },
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
