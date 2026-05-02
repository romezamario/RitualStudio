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
import { getPaymentMode } from "@/lib/payment-mode";
import { getMercadoPagoAccessTokenByEnvironment, getMercadoPagoPublicKey } from "@/lib/mercadopago";
import { validateMercadoPagoEnv } from "@/lib/mercadopago-env";
import { getServerSessionTokens, getUserFromAccessToken } from "@/lib/supabase/server";

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

function resolveMercadoPagoNotificationUrl(request: Request, mode: "prod" | "test") {
  const configuredUrl = (mode === "test" ? process.env.MP_NOTIFICATION_URL_TEST?.trim() : process.env.MP_NOTIFICATION_URL_PROD?.trim()) ?? "";

  if (configuredUrl) {
    return configuredUrl;
  }

  const legacyConfiguredUrl = process.env.MP_NOTIFICATION_URL?.trim();

  if (legacyConfiguredUrl) {
    return legacyConfiguredUrl;
  }

  const requestUrl = new URL(request.url);
  return `${requestUrl.origin}/api/mercadopago/webhook/${mode}`;
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

type ReserveCourseSpotsRpcInput = {
  p_order_id: string;
  p_course_items: Array<{
    course_id: string;
    course_session_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    participants: string[];
  }>;
};

const PAYMENT_RELEASE_STATUSES = new Set(["rejected", "cancelled"]);

async function reserveCourseCapacity(
  orderId: string,
  lineItems: ValidatedLineItem[],
  participantsBySession: Map<string, string[]>,
) {
  const courseItems = lineItems
    .filter((item) => item.kind === "course" && item.courseId && item.courseSessionId)
    .map((item) => ({
      course_id: item.courseId as string,
      course_session_id: item.courseSessionId as string,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
      participants: participantsBySession.get(item.courseSessionId as string) ?? [],
    }));

  if (!courseItems.length) {
    return;
  }

  const { error } = await supabaseAdminRequest<unknown[]>("/rest/v1/rpc/reserve_course_capacity_for_order", {
    method: "POST",
    body: JSON.stringify({
      p_order_id: orderId,
      p_course_items: courseItems,
    } satisfies ReserveCourseSpotsRpcInput),
  });

  if (error) {
    throw new Error(error.includes("Cupo insuficiente") ? error : `No fue posible reservar cupo para el curso. ${error}`);
  }
}

async function releaseCourseCapacity(orderId: string, reason: string) {
  const { error } = await supabaseAdminRequest<unknown[]>("/rest/v1/rpc/release_course_capacity_for_order", {
    method: "POST",
    body: JSON.stringify({
      p_order_id: orderId,
      p_reason: reason,
    }),
  });

  if (error) {
    console.error("[MP create-order] No se pudo liberar cupo del curso:", error);
  }
}

async function deleteOrderDraft(orderId: string) {
  const { error } = await supabaseAdminRequest<unknown[]>(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: "DELETE",
  });

  if (error) {
    console.error("[MP create-order] No se pudo eliminar orden local tras falla del pago:", error);
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

  let createdOrderId: string | null = null;
  let currentPaymentMode: "prod" | "test" | null = null;
  let currentExternalReference: string | null = null;

  try {
    const paymentMode = await getPaymentMode();
    currentPaymentMode = paymentMode;
    const mpPublicKey = getMercadoPagoPublicKey(paymentMode);
    const mpAccessToken = getMercadoPagoAccessTokenByEnvironment(paymentMode);

    try {
      validateMercadoPagoEnv({ publicKey: mpPublicKey, accessToken: mpAccessToken });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Configuración inválida de Mercado Pago.";
      console.error("[MP create-order] Invalid Mercado Pago environment", {
        paymentMode,
        publicKeyPrefix: mpPublicKey ? mpPublicKey.slice(0, 7) : "missing",
        accessTokenPrefix: mpAccessToken ? mpAccessToken.slice(0, 7) : "missing",
      });
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { accessToken } = await getServerSessionTokens();
    const sessionUser = await getUserFromAccessToken(accessToken);
    const { lineItems, totalAmount } = await validateAndPriceLineItems(items);
    const validatedCourseParticipants = validateCourseParticipantsBySession(body, lineItems);

    validateMercadoPagoAmount(totalAmount);

    const isTestModePayment = paymentMode === "test";
    const externalReference = isTestModePayment
      ? `ritual-test-${Date.now()}-${randomUUID().slice(0, 8)}`
      : `ritual-${Date.now()}-${randomUUID().slice(0, 8)}`;
    currentExternalReference = externalReference;
    const idempotencyKey = randomUUID();

    const orderInsert = {
      user_id: sessionUser?.id ?? null,
      external_reference: externalReference,
      status: "pending_payment",
      total_amount: totalAmount,
      customer_email: normalizedReceiptEmail ?? payer.email,
      metadata: {
        source: "checkout-bricks-card-payment",
        mixed_items_summary: {
          products: lineItems.filter((item) => item.kind === "product").map((item) => ({
            slug: item.slug,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
          courses: lineItems
            .filter((item) => item.kind === "course")
            .map((item) => ({
              slug: item.slug,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              course_id: item.courseId ?? null,
              course_session_id: item.courseSessionId ?? null,
              session_starts_at: item.sessionStartsAt ?? null,
              participants: item.courseSessionId ? validatedCourseParticipants.get(item.courseSessionId) ?? [] : [],
            })),
        },
        installments,
        payment_method_id,
        payer_email: payer.email,
        receipt_email: normalizedReceiptEmail ?? payer.email,
        idempotency_key: idempotencyKey,
        payment_mode: paymentMode,
        course_participants: Object.fromEntries(validatedCourseParticipants),
      },
    };

    const { data: orderRows, error: orderCreateError } = await supabaseAdminRequest<OrderInsertRow[]>("/rest/v1/orders", {
      method: "POST",
      body: JSON.stringify(orderInsert),
    });

    if (orderCreateError || !orderRows?.[0]?.id) {
      throw new Error(orderCreateError ?? "No fue posible crear la orden local antes del pago.");
    }

    const orderId = orderRows[0].id;
    createdOrderId = orderId;

    await reserveCourseCapacity(orderId, lineItems, validatedCourseParticipants);

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
      description: `${isTestModePayment ? "[TEST] " : ""}${lineItems
        .map((item) => `${item.quantity}x ${item.name}`)
        .join(" | ")
        .slice(0, isTestModePayment ? 232 : 240)}`,
      additional_info: {
        items: lineItems.map((item) => ({
          id: item.slug,
          title: item.name,
          description: item.description ?? item.name,
          category_id: item.categoryId ?? (item.kind === "course" ? "services" : "home"),
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      },
      notification_url: resolveMercadoPagoNotificationUrl(request, paymentMode),
    };

    const payment = await mpApiFetch<MpPaymentResponse>("/v1/payments", {
      environment: paymentMode,
      accessToken: mpAccessToken,
      method: "POST",
      headers: {
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    const normalizedStatus = mapPaymentStatus(payment.status);
    const mercadoPagoOrderId = payment.order?.id ? String(payment.order.id) : `payment-${String(payment.id ?? "")}`;

    const { error: orderUpdateError } = await supabaseAdminRequest<unknown[]>(
      `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          mercado_pago_order_id: mercadoPagoOrderId,
          status: payment.status ?? "unknown",
          total_amount: payment.transaction_amount ?? totalAmount,
          raw_response: payment,
          metadata: {
            ...orderInsert.metadata,
            items: lineItems,
            status_detail: payment.status_detail ?? null,
            external_reference: externalReference,
          },
        }),
      },
    );

    if (orderUpdateError) {
      console.error("[MP create-order] No se pudo actualizar order en Supabase:", orderUpdateError);
    }

    if (payment?.id) {
      const paymentRow = {
        order_id: orderId,
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

    if (PAYMENT_RELEASE_STATUSES.has((payment.status ?? "").toLowerCase())) {
      await releaseCourseCapacity(orderId, `create-order-${String(payment.status ?? "unknown")}`);
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
    const errorMessage =
      error instanceof Error ? error.message : "No fue posible procesar el pago en este momento. Intenta nuevamente.";
    const status = getValidationErrorStatus(errorMessage);

    if (currentPaymentMode === "test" && createdOrderId && status >= 500) {
      const { error: testModeOrderUpdateError } = await supabaseAdminRequest<unknown[]>(
        `/rest/v1/orders?id=eq.${encodeURIComponent(createdOrderId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "error",
            metadata: {
              fallback_reason: "test_mode_500_bypass",
              fallback_error_message: errorMessage,
              fallback_at: new Date().toISOString(),
            },
          }),
        },
      );

      if (testModeOrderUpdateError) {
        console.error("[MP create-order] No se pudo actualizar orden fallback de test:", testModeOrderUpdateError);
      }

      console.warn("[MP create-order] Test mode fallback activado por error 500 en registro de pago.", {
        orderId: createdOrderId,
        externalReference: currentExternalReference,
      });

      return NextResponse.json({
        order_id: null,
        payment_id: null,
        status: "error",
        status_detail: "test_mode_500_bypass",
        external_reference: currentExternalReference,
        normalized_status: "error",
      });
    }

    if (createdOrderId) {
      await releaseCourseCapacity(createdOrderId, "create-order-mp-request-failed");
      await deleteOrderDraft(createdOrderId);
    }

    console.error("[MP create-order] Error procesando orden:", error);

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
