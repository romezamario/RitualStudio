import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  mapPaymentStatus,
  mpApiFetch,
  type MpCreateOrderInput,
  type MpPaymentResponse,
  validateAndPriceLineItems,
  validateMercadoPagoAmount,
} from "@/lib/mercadopago";
import { supabaseAdminRequest } from "@/lib/supabase-admin";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function normalizeIssuerId(rawIssuerId: string | number | undefined) {
  if (rawIssuerId === undefined || rawIssuerId === null || rawIssuerId === "") {
    return undefined;
  }

  const parsed = Number(rawIssuerId);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.trunc(parsed);
}

function getValidationErrorStatus(message: string) {
  const knownValidationMessages = [
    "Debes enviar al menos un producto",
    "Producto inválido",
    "Cantidad inválida",
    "No fue posible calcular el total de la orden",
    "El monto mínimo para pagar con tarjeta en este checkout",
  ];

  return knownValidationMessages.some((knownMessage) => message.includes(knownMessage)) ? 400 : 500;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as MpCreateOrderInput | null;

  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { token, payment_method_id, installments, issuer_id, payer, items } = body;

  if (!token || !payment_method_id || !payer?.email) {
    return NextResponse.json({ error: "Faltan datos obligatorios del pago." }, { status: 400 });
  }

  if (!isValidEmail(payer.email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  if (!Number.isInteger(installments) || installments < 1 || installments > 24) {
    return NextResponse.json({ error: "Cuotas inválidas." }, { status: 400 });
  }

  try {
    const { lineItems, totalAmount } = await validateAndPriceLineItems(items);
    validateMercadoPagoAmount(totalAmount);
    const externalReference = `ritual-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const idempotencyKey = randomUUID();

    const normalizedIssuerId = normalizeIssuerId(issuer_id);

    const paymentPayload = {
      token,
      transaction_amount: totalAmount,
      installments,
      payment_method_id,
      ...(normalizedIssuerId ? { issuer_id: normalizedIssuerId } : {}),
      payer: {
        email: payer.email,
      },
      external_reference: externalReference,
      description: lineItems.map((item) => `${item.quantity}x ${item.name}`).join(" | ").slice(0, 240),
    };

    console.info("[MP create-order] Request a Mercado Pago", {
      external_reference: externalReference,
      transaction_amount: totalAmount,
      installments,
      payment_method_id,
      payer_email: payer.email,
      issuer_id: normalizeIssuerId(issuer_id) ?? null,
      items: lineItems.map((item) => ({
        slug: item.slug,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      })),
    });

    const payment = await mpApiFetch<MpPaymentResponse>("/v1/payments", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    const normalizedStatus = mapPaymentStatus(payment.status);
    const mercadoPagoOrderId = payment.order?.id ? String(payment.order.id) : `payment-${String(payment.id ?? "")}`;

    const orderInsert = {
      external_reference: externalReference,
      mercado_pago_order_id: mercadoPagoOrderId,
      status: payment.status ?? "unknown",
      total_amount: payment.transaction_amount ?? totalAmount,
      customer_email: payer.email,
      metadata: {
        items: lineItems,
        installments,
        payment_method_id,
        source: "checkout-bricks-card-payment",
      },
      raw_response: payment,
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
        mercado_pago_order_id: mercadoPagoOrderId,
        status: payment.status ?? "unknown",
        status_detail: payment.status_detail ?? null,
        payment_method: payment.payment_method_id ?? payment_method_id,
        payment_method_type: payment.payment_type_id ?? null,
        amount: payment.transaction_amount ?? totalAmount,
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
      order_id: payment.order?.id,
      payment_id: payment.id,
      status: payment.status ?? "unknown",
      status_detail: payment.status_detail ?? null,
      external_reference: externalReference,
      normalized_status: normalizedStatus,
      total_amount: payment.transaction_amount ?? totalAmount,
    });
  } catch (error) {
    console.error("[MP create-order] Error procesando orden:", error);
    const errorMessage =
      error instanceof Error ? error.message : "No fue posible procesar el pago en este momento. Intenta nuevamente.";
    const status = getValidationErrorStatus(errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}
