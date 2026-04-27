"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
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

type MpBrickFormData = {
  token: string;
  payment_method_id: string;
  payment_method_type?: string;
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

export default function CheckoutClient() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("idle");
  const [feedback, setFeedback] = useState("Completa tus datos para procesar el pago con tarjeta sin salir del sitio.");
  const isBrickMounted = useRef(false);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + parseMxPrice(item.price) * item.quantity, 0);
  }, [items]);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        slug: item.slug,
        quantity: item.quantity,
      })),
    [items]
  );

  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim();
  const isProductionKey = /^APP_USR-/i.test(publicKey ?? "");
  const isBelowMercadoPagoMinAmount = total < MIN_MX_CARD_PAYMENT_AMOUNT;

  useEffect(() => {
    return () => {
      if (window.cardPaymentBrickController) {
        window.cardPaymentBrickController.unmount();
        window.cardPaymentBrickController = undefined;
      }
      isBrickMounted.current = false;
    };
  }, []);

  const mountBrick = async () => {
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
            setCheckoutStatus("loading");

            return new Promise<void>((resolve, reject) => {
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
                  payer: {
                    email: formData.payer.email,
                  },
                  items: checkoutItems,
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

                    if (formData.payer.email) {
                      successParams.set("email", formData.payer.email);
                    }

                    router.push(`/checkout/exito?${successParams.toString()}`);
                    setTimeout(() => {
                      clearCart();
                    }, 0);
                    setFeedback("Pago acreditado. Te estamos llevando al resumen de tu compra.");
                  } else if (normalized === "pending") {
                    setFeedback("Pago pendiente. Estamos esperando confirmación de Mercado Pago.");
                  } else if (normalized === "rejected") {
                    setFeedback("Pago rechazado. Intenta con otra tarjeta o método de pago.");
                  } else {
                    setFeedback("No pudimos confirmar el pago. Intenta nuevamente en unos minutos.");
                  }

                  resolve();
                })
                .catch((error: unknown) => {
                  setCheckoutStatus("error");
                  setFeedback(error instanceof Error ? error.message : "Error inesperado al enviar el pago.");
                  reject(error);
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
    } catch (error) {
      setCheckoutStatus("error");
      setFeedback("No se pudo inicializar Mercado Pago. Intenta recargar la página.");
      console.error("[Checkout] mount brick error:", error);
    }
  };

  if (!publicKey) {
    return (
      <section className="studio-card checkout-state checkout-state-error">
        <h2>Checkout no disponible</h2>
        <p>
          Falta configurar <code>NEXT_PUBLIC_MP_PUBLIC_KEY</code>. Agrega la variable en Vercel para habilitar pagos
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
              <li key={item.slug}>
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
          <div id="mp-card-payment-brick" className="mp-brick-container" />
        </article>
      </section>
    </>
  );
}
