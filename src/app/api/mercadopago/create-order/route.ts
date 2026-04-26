import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  mapPaymentStatus,
  mpApiFetch,
  type MpCreateOrderInput,
  type MpOrderResponse,
  validateAndPriceLineItems,
} from "@/lib/mercadopago";
import { supabaseAdminRequest } from "@/lib/supabase-admin";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as MpCreateOrderInput | null;

  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { token, payment_method_id, payment_method_type, installments, payer, items } = body;

  if (!token || !payment_method_id || !payer?.email) {
    return NextResponse.json({ error: "Faltan datos obligatorios del pago." }, { status: 400 });
  }

  if (!isValidEmail(payer.email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  if (!Number.isInteger(installments) || installments < 1 || installments > 24) {
    return NextResponse.json({ error: "Cuotas inválidas." }, { status: 400 });
  }

  const resolvedPaymentMethodType = payment_method_type || "credit_card";

  try {
    const { lineItems, totalAmount } = validateAndPriceLineItems(items);
    const externalReference = `ritual-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const idempotencyKey = randomUUID();

    const orderPayload = {
      type: "online",
      processing_mode: "automatic",
      external_reference: externalReference,
      total_amount: totalAmount,
      payer: {
        email: payer.email,
      },
      transactions: {
        payments: [
          {
            amount: totalAmount,
            payment_method: {
              id: payment_method_id,
              type: resolvedPaymentMethodType,
            },
            token,
            installments,
          },
        ],
      },
    };

    const order = await mpApiFetch<MpOrderResponse>("/v1/orders", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    const payment = order.transactions?.payments?.[0];
    const normalizedStatus = mapPaymentStatus(payment?.status ?? order.status);

    const orderInsert = {
      external_reference: externalReference,
      mercado_pago_order_id: String(order.id ?? ""),
      status: order.status ?? payment?.status ?? "unknown",
      total_amount: totalAmount,
      customer_email: payer.email,
      metadata: {
        items: lineItems,
        installments,
        payment_method_id,
        payment_method_type,
        resolved_payment_method_type: resolvedPaymentMethodType,
      },
      raw_response: order,
    };

    const { error: orderError } = await supabaseAdminRequest<unknown[]>("/rest/v1/orders", {
      method: "POST",
      body: JSON.stringify(orderInsert),
    });

    if (orderError) {
      console.error("[MP create-order] No se pudo guardar order en Supabase:", orderError);
    }

    if (payment?.id) {
      const paymentRow = {
        mercado_pago_payment_id: String(payment.id),
        mercado_pago_order_id: String(order.id ?? ""),
        status: payment.status ?? order.status ?? "unknown",
        status_detail: payment.status_detail ?? order.status_detail ?? null,
        payment_method: payment.payment_method?.id ?? payment_method_id,
        payment_method_type: payment.payment_method?.type ?? resolvedPaymentMethodType,
        amount: payment.amount ?? totalAmount,
        raw_response: payment,
      };

      const { error: paymentError } = await supabaseAdminRequest<unknown[]>("/rest/v1/payments", {
        method: "POST",
        body: JSON.stringify(paymentRow),
      });

      if (paymentError) {
        console.error("[MP create-order] No se pudo guardar payment en Supabase:", paymentError);
      }
    }

    return NextResponse.json({
      order_id: order.id,
      payment_id: payment?.id,
      status: payment?.status ?? order.status ?? "unknown",
      status_detail: payment?.status_detail ?? order.status_detail ?? null,
      external_reference: externalReference,
      normalized_status: normalizedStatus,
      total_amount: totalAmount,
    });
  } catch (error) {
    console.error("[MP create-order] Error procesando orden:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible procesar el pago en este momento. Intenta nuevamente.",
      },
      { status: 500 }
    );
  }
}
