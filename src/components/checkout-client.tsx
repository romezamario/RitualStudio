"use client";

import Script from "next/script";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCartItemLineKey, useCart } from "@/components/cart-context";
import { useAuth } from "@/components/auth-context";
import { MIN_MX_CARD_PAYMENT_AMOUNT, parseMxPrice } from "@/lib/mercadopago";

type CheckoutStatus = "idle" | "loading" | "approved" | "pending" | "rejected" | "error";

type CreateOrderResponse = {
  external_reference?: string;
  payment_id?: string | number;
  status?: string;
  status_detail?: string | null;
  total_amount?: number;
  normalized_status?: CheckoutStatus;
  error?: string;
};

type MpBrickError = {
  message?: string;
  cause?: Array<{ code?: string; description?: string }>;
};

type CourseParticipantsByLine = Record<string, string[]>;
type CourseErrorsByLine = Record<string, string | null>;

type CheckoutClientProps = {
  mercadoPagoPublicKey: string;
};

const MIN_PARTICIPANT_NAME_LENGTH = 2;

function normalizeStatusDetailCode(statusDetail?: string | null) {
  return (statusDetail ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function getCheckoutFeedbackByResult(normalizedStatus: CheckoutStatus, statusDetail?: string | null) {
  const normalizedDetail = normalizeStatusDetailCode(statusDetail);

  if (normalizedStatus === "approved") {
    return "Pago acreditado. Te estamos llevando al resumen de tu compra.";
  }

  if (normalizedStatus === "pending") {
    if (normalizedDetail === "cont" || normalizedDetail === "pending_contingency") {
      return "Pago pendiente de confirmación. Estamos esperando validación de Mercado Pago.";
    }

    if (normalizedDetail === "pending_review_manual") {
      return "Tu pago está en revisión manual. Te avisaremos cuando Mercado Pago lo confirme.";
    }

    return "Pago pendiente. Estamos esperando confirmación de Mercado Pago.";
  }

  if (normalizedStatus === "rejected") {
    const rejectionMessages: Record<string, string> = {
      othe: "Pago rechazado por un error general. Intenta nuevamente o usa otra tarjeta.",
      other_reason: "Pago rechazado por un error general. Intenta nuevamente o usa otra tarjeta.",
      call: "Tu banco requiere autorización. Llama al banco y vuelve a intentar el pago.",
      cc_rejected_call_for_authorize: "Tu banco requiere autorización. Llama al banco y vuelve a intentar el pago.",
      fund: "Pago rechazado por fondos insuficientes. Prueba con otra tarjeta o reduce el monto.",
      cc_rejected_insufficient_amount: "Pago rechazado por fondos insuficientes. Prueba con otra tarjeta o reduce el monto.",
      secu: "Pago rechazado por código de seguridad inválido. Verifica el CVV e inténtalo de nuevo.",
      cc_rejected_bad_filled_security_code:
        "Pago rechazado por código de seguridad inválido. Verifica el CVV e inténtalo de nuevo.",
      expi: "Pago rechazado por problema con la fecha de vencimiento. Revisa mes/año de la tarjeta.",
      cc_rejected_bad_filled_date:
        "Pago rechazado por problema con la fecha de vencimiento. Revisa mes/año de la tarjeta.",
      cc_rejected_card_expired: "Pago rechazado porque la tarjeta está vencida. Usa otra tarjeta vigente.",
      form: "Pago rechazado por datos incompletos o inválidos del formulario. Revisa la información e intenta otra vez.",
      cc_rejected_bad_filled_card_number:
        "Pago rechazado por número de tarjeta inválido. Verifica los datos e intenta de nuevo.",
      cc_rejected_bad_filled_other:
        "Pago rechazado por datos incompletos o inválidos del formulario. Revisa la información e intenta otra vez.",
      cc_rejected_blacklist: "No fue posible procesar el pago con esta tarjeta. Intenta con otro método de pago.",
      cc_rejected_high_risk:
        "El pago fue rechazado por validaciones de seguridad. Prueba con otra tarjeta o método de pago.",
      cc_rejected_duplicated_payment:
        "Detectamos un intento de pago duplicado reciente. Espera unos segundos antes de reintentar.",
      cc_rejected_max_attempts:
        "Se alcanzó el límite de intentos para esta tarjeta. Intenta más tarde u otro método de pago.",
    };

    if (rejectionMessages[normalizedDetail]) {
      return rejectionMessages[normalizedDetail];
    }

    return "Pago rechazado. Intenta con otra tarjeta o método de pago.";
  }

  return "No pudimos confirmar el pago. Intenta nuevamente en unos minutos.";
}

function getCheckoutSubmissionErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "No fue posible procesar el pago en este momento. Intenta nuevamente.";
  }

  const normalizedMessage = error.message.trim().toLowerCase();

  if (!normalizedMessage || normalizedMessage === "internal_error") {
    return "Mercado Pago no pudo autorizar este intento por un error interno. Reintenta en unos segundos; si persiste, usa otra tarjeta o verifica que tus credenciales MP (public key/access token) pertenezcan al mismo entorno.";
  }

  return error.message;
}

function getHumanReadableBrickError(error: unknown, isProductionKey: boolean) {
  const fallback = "Hubo un problema en el formulario de pago. Verifica tus datos e intenta de nuevo.";

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const mpError = error as MpBrickError;
  const causeCode = mpError.cause?.[0]?.code?.toLowerCase() ?? "";
  const causeDescription = mpError.cause?.[0]?.description;

  if (causeCode.includes("get_payment_methods") || causeCode.includes("bin")) {
    return isProductionKey
      ? "No pudimos validar esta tarjeta en producción. Si estás probando integración, usa llaves TEST con tarjetas de prueba; con llaves APP_USR usa una tarjeta real habilitada."
      : "No pudimos obtener la información de esta tarjeta de prueba. Revisa número, vencimiento y CVV o intenta otra tarjeta de test de Mercado Pago.";
  }

  if (causeDescription) {
    return `Error de Mercado Pago: ${causeDescription}`;
  }

  if (mpError.message) {
    return `Error de Mercado Pago: ${mpError.message}`;
  }

  return fallback;
}

function validateCourseParticipants(courseParticipantsByLine: CourseParticipantsByLine) {
  const errorsByLine: CourseErrorsByLine = {};

  for (const [lineKey, participants] of Object.entries(courseParticipantsByLine)) {
    if (!participants.length) {
      errorsByLine[lineKey] = "Debes registrar al menos un participante.";
      continue;
    }

    const normalized = participants.map((participant) => participant.trim());

    if (normalized.some((participant) => participant.length < MIN_PARTICIPANT_NAME_LENGTH)) {
      errorsByLine[lineKey] = `Cada nombre debe tener al menos ${MIN_PARTICIPANT_NAME_LENGTH} caracteres.`;
      continue;
    }

    const duplicates = new Set(normalized.map((participant) => participant.toLocaleLowerCase("es-MX")));

    if (duplicates.size !== normalized.length) {
      errorsByLine[lineKey] = "No se permiten nombres duplicados exactos dentro de la misma sesión.";
      continue;
    }

    errorsByLine[lineKey] = null;
  }

  return errorsByLine;
}

type MpBrickFormData = {
  token: string;
  payment_method_id: string;
  payment_method_type?: string;
  issuer_id?: string | number;
  installments: number;
  payer: {
    email: string;
  };
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      bricks: () => {
        create: (
          brickName: string,
          containerId: string,
          settings: Record<string, unknown>
        ) => Promise<{ unmount: () => void }>;
      };
    };
    cardPaymentBrickController?: {
      unmount: () => void;
    };
  }
}

export default function CheckoutClient({ mercadoPagoPublicKey }: CheckoutClientProps) {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("idle");
  const [feedback, setFeedback] = useState("Completa tus datos para procesar el pago con tarjeta sin salir del sitio.");
  const isBrickMounted = useRef(false);
  const initializedPayerEmail = useRef("");

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + parseMxPrice(item.price) * item.quantity, 0);
  }, [items]);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => {
        if (item.kind === "course") {
          return {
            kind: "course" as const,
            slug: item.slug,
            course_id: item.courseId,
            course_session_id: item.courseSessionId,
            session_starts_at: item.sessionStartsAt,
            quantity: item.quantity,
          };
        }

        return {
          kind: "product" as const,
          slug: item.slug,
          quantity: item.quantity,
        };
      }),
    [items]
  );

  const courseLines = useMemo(
    () =>
      items
        .map((item) => {
          if (item.kind !== "course") {
            return null;
          }

          const lineKey = getCartItemLineKey(item);

          return {
            lineKey,
            courseSessionId: item.courseSessionId,
            courseTitle: item.name,
            quantity: item.quantity,
          };
        })
        .filter((line): line is { lineKey: string; courseSessionId: string; courseTitle: string; quantity: number } =>
          Boolean(line),
        ),
    [items],
  );

  const [courseParticipantsByLine, setCourseParticipantsByLine] = useState<CourseParticipantsByLine>({});
  const [courseErrorsByLine, setCourseErrorsByLine] = useState<CourseErrorsByLine>({});
  const courseParticipantsByLineRef = useRef<CourseParticipantsByLine>({});
  const courseLinesRef = useRef(courseLines);

  useEffect(() => {
    setCourseParticipantsByLine((current) => {
      const nextState: CourseParticipantsByLine = {};

      for (const line of courseLines) {
        const existingNames = current[line.lineKey] ?? [];
        nextState[line.lineKey] = Array.from({ length: line.quantity }, (_, index) => existingNames[index] ?? "");
      }

      return nextState;
    });
  }, [courseLines]);

  useEffect(() => {
    setCourseErrorsByLine((current) => {
      const nextState: CourseErrorsByLine = {};

      for (const line of courseLines) {
        nextState[line.lineKey] = current[line.lineKey] ?? null;
      }

      return nextState;
    });
  }, [courseLines]);

  useEffect(() => {
    courseParticipantsByLineRef.current = courseParticipantsByLine;
  }, [courseParticipantsByLine]);

  useEffect(() => {
    courseLinesRef.current = courseLines;
  }, [courseLines]);

  const publicKey = mercadoPagoPublicKey.trim();
  const isProductionKey = /^APP_USR-/i.test(publicKey ?? "");
  const isBelowMercadoPagoMinAmount = total < MIN_MX_CARD_PAYMENT_AMOUNT;
  const normalizedUserEmail = user?.email.trim().toLowerCase() ?? "";

  const updateCourseParticipant = useCallback((lineKey: string, index: number, value: string) => {
    setCourseParticipantsByLine((current) => {
      const currentLineParticipants = current[lineKey] ?? [];
      const nextLineParticipants = [...currentLineParticipants];
      nextLineParticipants[index] = value;

      return {
        ...current,
        [lineKey]: nextLineParticipants,
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      if (window.cardPaymentBrickController) {
        window.cardPaymentBrickController.unmount();
        window.cardPaymentBrickController = undefined;
      }
      isBrickMounted.current = false;
    };
  }, []);

  const mountBrick = useCallback(async () => {
    if (
      isBrickMounted.current ||
      !window.MercadoPago ||
      !publicKey ||
      !items.length ||
      total <= 0 ||
      isBelowMercadoPagoMinAmount
    ) {
      return;
    }

    setCheckoutStatus("loading");

    try {
      const mp = new window.MercadoPago(publicKey, { locale: "es-MX" });
      const bricksBuilder = mp.bricks();

      window.cardPaymentBrickController = await bricksBuilder.create("cardPayment", "mp-card-payment-brick", {
        initialization: {
          amount: total,
          payer: normalizedUserEmail
            ? {
                email: normalizedUserEmail,
              }
            : undefined,
        },
        customization: {
          visual: {
            style: {
              theme: "default",
            },
          },
        },
        callbacks: {
          onReady: () => {
            setCheckoutStatus("idle");
            setFeedback("Formulario listo. Puedes pagar con tarjeta y cuotas sin redirecciones.");
          },
          onSubmit: (formData: MpBrickFormData) => {
            const normalizedPayerEmail = formData.payer.email.trim().toLowerCase();
            setCheckoutStatus("loading");

            return new Promise<void>((resolve) => {
              const currentParticipantsByLine = courseParticipantsByLineRef.current;
              const frontendValidationErrors = validateCourseParticipants(currentParticipantsByLine);
              setCourseErrorsByLine(frontendValidationErrors);

              if (Object.values(frontendValidationErrors).some((errorMessage) => errorMessage)) {
                setCheckoutStatus("error");
                setFeedback("Completa los nombres de participantes por sesión antes de continuar con el pago.");
                resolve();
                return;
              }

              const courseParticipantsBySession = Object.fromEntries(
                courseLinesRef.current.map((line) => [
                  line.courseSessionId,
                  (currentParticipantsByLine[line.lineKey] ?? []).map((fullName) => fullName.trim()),
                ]),
              );

              fetch("/api/mercadopago/create-order", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  token: formData.token,
                  payment_method_id: formData.payment_method_id,
                  payment_method_type: formData.payment_method_type,
                  installments: formData.installments,
                  issuer_id: formData.issuer_id,
                  payer: {
                    email: normalizedPayerEmail,
                  },
                  receipt_email: normalizedPayerEmail,
                  items: checkoutItems.map((item) => {
                    if (item.kind !== "course") {
                      return item;
                    }

                    return {
                      ...item,
                      course_participants: courseParticipantsBySession[item.course_session_id] ?? [],
                    };
                  }),
                  course_participants: courseParticipantsBySession,
                }),
              })
                .then(async (response) => {
                  const result = (await response.json().catch(() => null)) as CreateOrderResponse | null;

                  if (!response.ok || !result) {
                    throw new Error(result?.error ?? "No fue posible procesar el pago.");
                  }

                  const normalized = result.normalized_status ?? "error";
                  setCheckoutStatus(normalized);

                  if (normalized === "approved") {
                    const successParams = new URLSearchParams({
                      external_reference: result.external_reference ?? "",
                      payment_id: String(result.payment_id ?? ""),
                      status: result.status ?? "approved",
                      total_amount: String(result.total_amount ?? total),
                    });

                    if (normalizedPayerEmail) {
                      successParams.set("email", normalizedPayerEmail);
                    }

                    router.push(`/checkout/exito?${successParams.toString()}`);
                    setTimeout(() => {
                      clearCart();
                    }, 0);
                  }

                  setFeedback(getCheckoutFeedbackByResult(normalized, result.status_detail));

                  resolve();
                })
                .catch((error: unknown) => {
                  setCheckoutStatus("error");
                  setFeedback(getCheckoutSubmissionErrorMessage(error));
                  resolve();
                });
            });
          },
          onError: (error: unknown) => {
            setCheckoutStatus("error");
            setFeedback(getHumanReadableBrickError(error, isProductionKey));
            console.error("[MP Brick]", error);
          },
        },
      });

      isBrickMounted.current = true;
      initializedPayerEmail.current = normalizedUserEmail;
    } catch (error) {
      setCheckoutStatus("error");
      setFeedback("No se pudo inicializar Mercado Pago. Intenta recargar la página.");
      console.error("[Checkout] mount brick error:", error);
    }
  }, [
    checkoutItems,
    clearCart,
    isBelowMercadoPagoMinAmount,
    isProductionKey,
    normalizedUserEmail,
    publicKey,
    router,
    total,
    items.length,
  ]);

  useEffect(() => {
    if (!window.MercadoPago) {
      return;
    }

    void mountBrick();
  }, [mountBrick]);

  useEffect(() => {
    if (!window.MercadoPago || !isBrickMounted.current) {
      return;
    }

    if (initializedPayerEmail.current === normalizedUserEmail) {
      return;
    }

    if (window.cardPaymentBrickController) {
      window.cardPaymentBrickController.unmount();
      window.cardPaymentBrickController = undefined;
    }

    isBrickMounted.current = false;
    void mountBrick();
  }, [mountBrick, normalizedUserEmail]);

  if (!publicKey) {
    return (
      <section className="studio-card checkout-state checkout-state-error">
        <h2>Checkout no disponible</h2>
        <p>
          Falta configurar <code>MP_PUBLIC_KEY_PROD</code>. Agrega la variable en Vercel para habilitar pagos
          embebidos.
        </p>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="studio-card checkout-state">
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos en marketplace para continuar con el pago embebido.</p>
        <Link href="/marketplace" className="btn btn-primary">
          Ir al marketplace
        </Link>
      </section>
    );
  }

  if (isBelowMercadoPagoMinAmount) {
    return (
      <section className="studio-card checkout-state checkout-state-error">
        <h2>Total no válido para pago con tarjeta</h2>
        <p>
          El total actual es <strong>${total.toLocaleString("es-MX")} MXN</strong> y Mercado Pago requiere al menos{" "}
          <strong>${MIN_MX_CARD_PAYMENT_AMOUNT} MXN</strong> para procesar pagos con tarjeta en este checkout.
        </p>
        <p>Agrega más productos al carrito o ajusta el precio para continuar.</p>
        <Link href="/carrito" className="btn btn-primary">
          Volver al carrito
        </Link>
      </section>
    );
  }

  return (
    <>
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" onLoad={mountBrick} />

      <section className="checkout-layout" aria-label="Pago con Mercado Pago embebido">
        <article className="studio-card checkout-summary">
          <p className="card-label">Resumen de compra</p>
          <h2>Checkout embebido</h2>
          <ul>
            {items.map((item) => (
              <li key={getCartItemLineKey(item)}>
                <span>{item.name}</span>
                <strong>
                  {item.quantity} x {item.price}
                </strong>
              </li>
            ))}
          </ul>
          <p className="checkout-total">Total: ${total.toLocaleString("es-MX")} MXN</p>
        </article>

        <article className="studio-card checkout-form-shell">
          <div className={`checkout-feedback checkout-feedback-${checkoutStatus}`} role="status" aria-live="polite">
            {feedback}
          </div>
          {courseLines.length ? (
            <section className="checkout-participants" aria-label="Participantes por sesión">
              <h3>Participantes</h3>
              {courseLines.map((line) => (
                <div key={line.lineKey} className="checkout-participants-line">
                  <p>
                    <strong>{line.courseTitle}</strong>
                  </p>
                  <div className="checkout-participants-grid">
                    {Array.from({ length: line.quantity }, (_, index) => (
                      <label key={`${line.lineKey}-participant-${index}`} className="checkout-participant-input">
                        <span>Participante {index + 1}</span>
                        <input
                          type="text"
                          value={courseParticipantsByLine[line.lineKey]?.[index] ?? ""}
                          onChange={(event) => updateCourseParticipant(line.lineKey, index, event.target.value)}
                          minLength={MIN_PARTICIPANT_NAME_LENGTH}
                          required
                        />
                      </label>
                    ))}
                  </div>
                  {courseErrorsByLine[line.lineKey] ? (
                    <p className="checkout-participants-error" role="alert">
                      {courseErrorsByLine[line.lineKey]}
                    </p>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}
          {normalizedUserEmail ? (
            <label className="checkout-receipt-email">
              <span>Correo electrónico para el pago</span>
              <input
                type="email"
                value={normalizedUserEmail}
                readOnly
                aria-readonly="true"
                aria-label="Correo electrónico prellenado del usuario autenticado"
              />
            </label>
          ) : null}
          <div id="mp-card-payment-brick" className="mp-brick-container" />
        </article>
      </section>
    </>
  );
}
