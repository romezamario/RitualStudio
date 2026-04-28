import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  mapPaymentStatus,
  mpApiFetch,
  type MpCreateOrderInput,
  type MpPaymentResponse,
  type ValidatedLineItem,
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
    "Debes enviar al menos un ítem",
    "Producto inválido",
    "Curso inválido",
    "Sesión inválida",
    "La sesión seleccionada",
    "Cupo insuficiente",
    "Cantidad inválida",
    "No fue posible calcular el total de la orden",
    "El monto mínimo para pagar con tarjeta en este checkout",
    "Participantes inválidos",
  ];

  return knownValidationMessages.some((knownMessage) => message.includes(knownMessage)) ? 400 : 500;
}

function validateCourseParticipantsBySession(input: MpCreateOrderInput, lineItems: ValidatedLineItem[]) {
  const participantsBySession = input.course_participants ?? {};

  if (input.course_participants && typeof input.course_participants !== "object") {
    throw new Error("Participantes inválidos: formato no soportado.");
  }

  const normalizedBySession = new Map<string, string[]>();

  for (const lineItem of lineItems) {
    if (lineItem.kind !== "course" || !lineItem.courseSessionId) {
      continue;
    }

    const originalCourseLine = input.items.find(
      (entry): entry is Extract<MpCreateOrderInput["items"][number], { kind: "course" }> =>
        entry.kind === "course" && entry.course_session_id === lineItem.courseSessionId,
    );

    const fromItemLine = Array.isArray(originalCourseLine?.course_participants)
      ? originalCourseLine.course_participants
      : undefined;
    const fromPayloadMap = Array.isArray(participantsBySession[lineItem.courseSessionId])
      ? participantsBySession[lineItem.courseSessionId]
      : undefined;
    const submittedParticipants = fromItemLine ?? fromPayloadMap ?? [];

    if (submittedParticipants.length !== lineItem.quantity) {
      throw new Error(
        `Participantes inválidos para ${lineItem.slug}: recibimos ${submittedParticipants.length} y se requieren ${lineItem.quantity}.`,
      );
    }

    const normalizedNames = submittedParticipants.map((name: string) => name.trim());

    if (normalizedNames.some((name) => name.length < 2)) {
      throw new Error(`Participantes inválidos para ${lineItem.slug}: cada nombre debe tener al menos 2 caracteres.`);
    }

    const dedup = new Set(normalizedNames.map((name: string) => name.toLocaleLowerCase("es-MX")));

    if (dedup.size !== normalizedNames.length) {
      throw new Error(`Participantes inválidos para ${lineItem.slug}: no se permiten nombres duplicados.`);
    }

    normalizedBySession.set(lineItem.courseSessionId, normalizedNames);
  }

  return normalizedBySession;
}

type OrderInsertRow = {
  id: string;
};

type OrderCourseItemInsertRow = {
  id: string;
};

async function persistCourseParticipants(
  orderId: string,
  lineItems: ValidatedLineItem[],
  participantsBySession: Map<string, string[]>,
) {
  for (const lineItem of lineItems) {
    if (lineItem.kind !== "course" || !lineItem.courseId || !lineItem.courseSessionId) {
      continue;
    }

    const lineParticipants = participantsBySession.get(lineItem.courseSessionId) ?? [];

    const orderCourseItemPayload = {
      order_id: orderId,
      course_id: lineItem.courseId,
      course_session_id: lineItem.courseSessionId,
      quantity: lineItem.quantity,
      unit_price: lineItem.unitPrice,
      subtotal: lineItem.subtotal,
      metadata: {
        source: "checkout-bricks-card-payment",
      },
    };

    const { data: orderCourseItems, error: orderCourseItemError } = await supabaseAdminRequest<OrderCourseItemInsertRow[]>(
      "/rest/v1/order_course_items",
      {
        method: "POST",
        body: JSON.stringify(orderCourseItemPayload),
      },
    );

    if (orderCourseItemError || !orderCourseItems?.[0]?.id) {
      console.error("[MP create-order] No se pudo guardar order_course_items en Supabase:", orderCourseItemError);
      continue;
    }

    if (!lineParticipants.length) {
      continue;
    }

    const participantsPayload = lineParticipants.map((fullName) => ({
      order_course_item_id: orderCourseItems[0].id,
      full_name: fullName,
    }));

    const { error: participantsError } = await supabaseAdminRequest<unknown[]>("/rest/v1/course_participants", {
      method: "POST",
      body: JSON.stringify(participantsPayload),
    });

    if (participantsError) {
      console.error("[MP create-order] No se pudo guardar course_participants en Supabase:", participantsError);
    }
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as MpCreateOrderInput | null;

  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { token, payment_method_id, installments, issuer_id, payer, receipt_email, items } = body;

  if (!token || !payment_method_id || !payer?.email) {
    return NextResponse.json({ error: "Faltan datos obligatorios del pago." }, { status: 400 });
  }

  if (!isValidEmail(payer.email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const normalizedReceiptEmail = receipt_email?.trim().toLowerCase();

  if (normalizedReceiptEmail && !isValidEmail(normalizedReceiptEmail)) {
    return NextResponse.json({ error: "Email de comprobante inválido." }, { status: 400 });
  }

  if (!Number.isInteger(installments) || installments < 1 || installments > 24) {
    return NextResponse.json({ error: "Cuotas inválidas." }, { status: 400 });
  }

  try {
    const { lineItems, totalAmount } = await validateAndPriceLineItems(items);
    const validatedCourseParticipants = validateCourseParticipantsBySession(body, lineItems);
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
      receipt_email: normalizedReceiptEmail ?? null,
      issuer_id: normalizeIssuerId(issuer_id) ?? null,
      items: lineItems.map((item) => ({
        kind: item.kind,
        slug: item.slug,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        course_id: item.courseId ?? null,
        course_session_id: item.courseSessionId ?? null,
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
      customer_email: normalizedReceiptEmail ?? payer.email,
      metadata: {
        items: lineItems,
        installments,
        payment_method_id,
        payer_email: payer.email,
        receipt_email: normalizedReceiptEmail ?? payer.email,
        source: "checkout-bricks-card-payment",
        course_participants: Object.fromEntries(validatedCourseParticipants),
      },
      raw_response: payment,
    };

    const { data: orderRows, error: orderError } = await supabaseAdminRequest<OrderInsertRow[]>("/rest/v1/orders", {
      method: "POST",
      body: JSON.stringify(orderInsert),
    });

    if (orderError) {
      console.error("[MP create-order] No se pudo guardar order en Supabase:", orderError);
    }

    if (orderRows?.[0]?.id) {
      await persistCourseParticipants(orderRows[0].id, lineItems, validatedCourseParticipants);
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

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
