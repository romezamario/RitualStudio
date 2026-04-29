import { NextResponse } from "next/server";
import { mpApiFetch } from "@/lib/mercadopago";
import { supabaseAdminRequest } from "@/lib/supabase-admin";

type PurchasedItem = {
  slug?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
};

type OrderRow = {
  external_reference?: string;
  mercado_pago_order_id?: string | null;
  status?: string | null;
  total_amount?: number | string | null;
  customer_email?: string | null;
  metadata?: {
    items?: PurchasedItem[];
  } | null;
  created_at?: string;
  updated_at?: string;
};

type PaymentRow = {
  order_id?: string | null;
  mercado_pago_payment_id?: string | null;
  mercado_pago_order_id?: string | null;
  status?: string | null;
  status_detail?: string | null;
  payment_method?: string | null;
  amount?: number | string | null;
  created_at?: string;
  updated_at?: string;
};

type MpPaymentLookup = {
  id?: string | number;
  status?: string | null;
  status_detail?: string | null;
  payment_method_id?: string | null;
  transaction_amount?: number | null;
  external_reference?: string | null;
  date_created?: string | null;
  date_last_updated?: string | null;
  payer?: {
    email?: string | null;
  } | null;
};

function normalizeLookupValue(value?: string | null) {
  return value?.trim() ?? "";
}

function normalizeStatus(rawStatus?: string | null) {
  if (!rawStatus) {
    return "unknown";
  }

  const status = rawStatus.trim().toLowerCase();

  if (status === "approved") {
    return "approved";
  }

  if (
    status === "pending" ||
    status === "pending_payment" ||
    status === "in_process" ||
    status === "in_mediation"
  ) {
    return "pending";
  }

  if (status === "rejected" || status === "cancelled" || status === "refunded" || status === "charged_back") {
    return "rejected";
  }

  return status;
}

function consolidateStatus(orderStatus?: string | null, paymentStatus?: string | null) {
  const normalizedPayment = normalizeStatus(paymentStatus);
  const normalizedOrder = normalizeStatus(orderStatus);

  if (normalizedPayment === "rejected" || normalizedOrder === "rejected") {
    return "rejected";
  }

  if (normalizedPayment === "approved" || normalizedOrder === "approved") {
    return "approved";
  }

  if (normalizedPayment === "pending" || normalizedOrder === "pending") {
    return "pending";
  }

  return normalizedPayment !== "unknown" ? normalizedPayment : normalizedOrder;
}

function toAmount(value?: number | string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchOrderByExternalReference(externalReference: string) {
  const { data, error } = await supabaseAdminRequest<OrderRow[]>(
    `/rest/v1/orders?select=external_reference,mercado_pago_order_id,status,total_amount,customer_email,metadata,created_at,updated_at&external_reference=eq.${encodeURIComponent(
      externalReference
    )}&order=created_at.desc&limit=1`
  );

  return { order: data?.[0] ?? null, error };
}

async function fetchOrderByMercadoPagoOrderId(mercadoPagoOrderId: string) {
  const { data, error } = await supabaseAdminRequest<OrderRow[]>(
    `/rest/v1/orders?select=external_reference,mercado_pago_order_id,status,total_amount,customer_email,metadata,created_at,updated_at&mercado_pago_order_id=eq.${encodeURIComponent(
      mercadoPagoOrderId
    )}&order=created_at.desc&limit=1`
  );

  return { order: data?.[0] ?? null, error };
}

async function fetchPaymentByPaymentId(paymentId: string) {
  const { data, error } = await supabaseAdminRequest<PaymentRow[]>(
    `/rest/v1/payments?select=order_id,mercado_pago_payment_id,mercado_pago_order_id,status,status_detail,payment_method,amount,created_at,updated_at&mercado_pago_payment_id=eq.${encodeURIComponent(
      paymentId
    )}&order=created_at.desc&limit=1`
  );

  return { payment: data?.[0] ?? null, error };
}

async function fetchPaymentByOrderId(mercadoPagoOrderId: string) {
  const { data, error } = await supabaseAdminRequest<PaymentRow[]>(
    `/rest/v1/payments?select=order_id,mercado_pago_payment_id,mercado_pago_order_id,status,status_detail,payment_method,amount,created_at,updated_at&mercado_pago_order_id=eq.${encodeURIComponent(
      mercadoPagoOrderId
    )}&order=created_at.desc&limit=1`
  );

  return { payment: data?.[0] ?? null, error };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const externalReference = normalizeLookupValue(searchParams.get("external_reference"));
  const paymentId = normalizeLookupValue(searchParams.get("payment_id"));

  if (!externalReference && !paymentId) {
    return NextResponse.json(
      {
        error: "Debes enviar al menos uno de estos query params: external_reference o payment_id.",
      },
      { status: 400 }
    );
  }

  let order: OrderRow | null = null;
  let payment: PaymentRow | null = null;

  if (externalReference) {
    const orderResult = await fetchOrderByExternalReference(externalReference);

    if (orderResult.error) {
      return NextResponse.json({ error: orderResult.error }, { status: 500 });
    }

    order = orderResult.order;
  }

  if (paymentId) {
    const paymentResult = await fetchPaymentByPaymentId(paymentId);

    if (paymentResult.error) {
      return NextResponse.json({ error: paymentResult.error }, { status: 500 });
    }

    payment = paymentResult.payment;
  }

  if (!payment && paymentId) {
    try {
      const mpPayment = await mpApiFetch<MpPaymentLookup>(`/v1/payments/${encodeURIComponent(paymentId)}`);

      payment = {
        mercado_pago_payment_id: String(mpPayment.id ?? paymentId),
        mercado_pago_order_id: null,
        status: mpPayment.status ?? null,
        status_detail: mpPayment.status_detail ?? null,
        payment_method: mpPayment.payment_method_id ?? null,
        amount: mpPayment.transaction_amount ?? null,
        created_at: mpPayment.date_created ?? undefined,
        updated_at: mpPayment.date_last_updated ?? undefined,
      };
    } catch {
      // Si Mercado Pago no responde, continuamos con datos locales disponibles.
    }
  }

  if (!payment && order?.mercado_pago_order_id) {
    const paymentByOrderResult = await fetchPaymentByOrderId(order.mercado_pago_order_id);

    if (!paymentByOrderResult.error) {
      payment = paymentByOrderResult.payment;
    }
  }

  if (!order && payment?.mercado_pago_order_id) {
    const orderByMercadoPagoOrderIdResult = await fetchOrderByMercadoPagoOrderId(payment.mercado_pago_order_id);

    if (orderByMercadoPagoOrderIdResult.error) {
      return NextResponse.json({ error: orderByMercadoPagoOrderIdResult.error }, { status: 500 });
    }

    order = orderByMercadoPagoOrderIdResult.order;
  }

  if (!order && !payment) {
    if (!paymentId) {
      return NextResponse.json(
        { found: false, error: "No encontramos una orden con los identificadores proporcionados." },
        { status: 404 }
      );
    }

    try {
      const mpPayment = await mpApiFetch<MpPaymentLookup>(`/v1/payments/${encodeURIComponent(paymentId)}`);
      const fallbackStatus = consolidateStatus(null, mpPayment.status ?? null);

      return NextResponse.json({
        found: true,
        receipt: {
          external_reference: mpPayment.external_reference ?? (externalReference || null),
          payment_id: String(mpPayment.id ?? paymentId),
          consolidated_status: fallbackStatus,
          order_status: null,
          payment_status: mpPayment.status ?? null,
          payment_status_detail: mpPayment.status_detail ?? null,
          total: toAmount(mpPayment.transaction_amount),
          customer_email: mpPayment.payer?.email ?? null,
          payment_method: mpPayment.payment_method_id ?? null,
          items: [],
          timestamps: {
            order_created_at: null,
            order_updated_at: null,
            payment_created_at: mpPayment.date_created ?? null,
            payment_updated_at: mpPayment.date_last_updated ?? null,
          },
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          found: false,
          error:
            error instanceof Error
              ? `No encontramos la orden en base local y Mercado Pago devolvió: ${error.message}`
              : "No encontramos una orden con los identificadores proporcionados.",
        },
        { status: 404 }
      );
    }
  }

  const items = Array.isArray(order?.metadata?.items) ? order.metadata.items : [];
  const consolidatedStatus = consolidateStatus(order?.status, payment?.status);

  return NextResponse.json({
    found: true,
    receipt: {
      external_reference: order?.external_reference ?? (externalReference || null),
      payment_id: payment?.mercado_pago_payment_id ?? (paymentId || null),
      consolidated_status: consolidatedStatus,
      order_status: order?.status ?? null,
      payment_status: payment?.status ?? null,
      payment_status_detail: payment?.status_detail ?? null,
      total: payment?.amount != null ? toAmount(payment.amount) : toAmount(order?.total_amount),
      customer_email: order?.customer_email ?? null,
      payment_method: payment?.payment_method ?? null,
      items,
      timestamps: {
        order_created_at: order?.created_at ?? null,
        order_updated_at: order?.updated_at ?? null,
        payment_created_at: payment?.created_at ?? null,
        payment_updated_at: payment?.updated_at ?? null,
      },
    },
  });
}
