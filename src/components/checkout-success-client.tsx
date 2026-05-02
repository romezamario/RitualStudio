"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { formatDateTimeMx } from "@/lib/date-time";

type PurchasedItem = {
  slug?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
};

type OrderSummaryResponse = {
  found: boolean;
  error?: string;
  receipt?: {
    external_reference?: string | null;
    payment_id?: string | null;
    consolidated_status?: string | null;
    order_status?: string | null;
    payment_status?: string | null;
    payment_status_detail?: string | null;
    total?: number;
    customer_email?: string | null;
    payment_method?: string | null;
    items?: PurchasedItem[];
    timestamps?: {
      order_created_at?: string | null;
      order_updated_at?: string | null;
      payment_created_at?: string | null;
      payment_updated_at?: string | null;
    };
  };
};

type ClaimOrdersResponse = {
  linked_orders?: number;
  message?: string;
  error?: string;
};

type CheckoutSuccessClientProps = {
  externalReference?: string;
  paymentId?: string;
};

function toCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeStatusLabel(rawStatus?: string | null) {
  const normalized = rawStatus?.trim().toLowerCase();

  if (normalized === "approved") {
    return "Acreditado";
  }

  if (normalized === "pending") {
    return "Pendiente";
  }

  if (normalized === "rejected") {
    return "Rechazado";
  }

  return rawStatus ? rawStatus : "Sin estado";
}

function formatDate(rawDate?: string | null) {
  if (!rawDate) {
    return "No disponible";
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return "No disponible";
  }

  return formatDateTimeMx(date, {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export default function CheckoutSuccessClient({ externalReference, paymentId }: CheckoutSuccessClientProps) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<OrderSummaryResponse["receipt"] | null>(null);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaimingOrders, setIsClaimingOrders] = useState(false);
  const hasAttemptedClaimRef = useRef(false);

  const fallbackExternalReference = externalReference?.trim() || "No disponible";
  const fallbackPaymentId = paymentId?.trim() || "No disponible";

  useEffect(() => {
    const query = new URLSearchParams();

    if (externalReference?.trim()) {
      query.set("external_reference", externalReference.trim());
    }

    if (paymentId?.trim()) {
      query.set("payment_id", paymentId.trim());
    }

    if (!query.toString()) {
      setError("No recibimos identificadores de compra para consultar tu comprobante.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/mercadopago/order-summary?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        const result = (await response.json().catch(() => null)) as OrderSummaryResponse | null;

        if (!response.ok || !result?.found || !result.receipt) {
          throw new Error(result?.error ?? "No encontramos una orden con los identificadores proporcionados.");
        }

        if (!isMounted) {
          return;
        }

        setSummary(result.receipt);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setSummary(null);
        setError(fetchError instanceof Error ? fetchError.message : "No fue posible consultar tu orden.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [externalReference, paymentId]);

  useEffect(() => {
    if (!summary || !isAuthenticated || hasAttemptedClaimRef.current) {
      return;
    }

    hasAttemptedClaimRef.current = true;

    const checkoutReference = summary.external_reference?.trim() || externalReference?.trim() || undefined;

    const claimOrders = async () => {
      setIsClaimingOrders(true);
      setClaimMessage(null);
      setClaimError(null);

      try {
        const response = await fetch("/api/auth/claim-orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            external_reference: checkoutReference,
          }),
        });

        const result = (await response.json().catch(() => null)) as ClaimOrdersResponse | null;

        if (!response.ok) {
          throw new Error(result?.error ?? "No fue posible vincular compras con tu cuenta.");
        }

        setClaimMessage(result?.message ?? "Vinculación de compras completada.");
      } catch (claimOrdersError) {
        setClaimError(claimOrdersError instanceof Error ? claimOrdersError.message : "No fue posible vincular compras.");
      } finally {
        setIsClaimingOrders(false);
      }
    };

    void claimOrders();
  }, [externalReference, isAuthenticated, summary]);

  const consolidatedStatus = summary?.consolidated_status ?? null;

  const statusMessage = useMemo(() => {
    if (consolidatedStatus === "pending") {
      return {
        title: "Tu pago está pendiente de confirmación",
        body: "Mercado Pago todavía está validando la operación. Te avisaremos cuando cambie de estado.",
      };
    }

    if (consolidatedStatus === "rejected") {
      return {
        title: "Tu pago fue rechazado",
        body: "Puedes intentar de nuevo con otra tarjeta o contactar a soporte si necesitas asistencia inmediata.",
      };
    }

    return {
      title: "Pago recibido",
      body: "Gracias por confiar en Ritual Studio. Ya tenemos tu solicitud y estamos preparando el siguiente paso.",
    };
  }, [consolidatedStatus]);

  const purchasedItems = Array.isArray(summary?.items) ? summary.items : [];
  const total = Number.isFinite(summary?.total) ? Number(summary?.total) : 0;
  const paymentMethod = summary?.payment_method || "No disponible";
  const customerEmail = summary?.customer_email || "No disponible";
  const loginRedirectQuery = new URLSearchParams();
  const summaryExternalReference = summary?.external_reference?.trim();
  const summaryPaymentId = summary?.payment_id?.trim();

  if (summaryExternalReference) {
    loginRedirectQuery.set("external_reference", summaryExternalReference);
  }

  if (summaryPaymentId) {
    loginRedirectQuery.set("payment_id", summaryPaymentId);
  }

  const loginRedirectPath = `/checkout/exito${loginRedirectQuery.toString() ? `?${loginRedirectQuery.toString()}` : ""}`;

  if (isLoading) {
    return (
      <section className="studio-card checkout-success-card" aria-live="polite">
        <p className="card-label">Checkout</p>
        <h2>Estamos consultando tu comprobante…</h2>
        <p>Esto puede tardar unos segundos mientras sincronizamos tu orden y el estado del pago.</p>
      </section>
    );
  }

  if (error || !summary) {
    return (
      <section className="studio-card checkout-success-card" aria-live="polite">
        <p className="card-label">Checkout</p>
        <h2>No pudimos localizar tu orden</h2>
        <p>{error ?? "No encontramos coincidencias con los identificadores proporcionados."}</p>
        <p>
          Si necesitas ayuda, comparte estos datos con soporte: referencia <strong>{fallbackExternalReference}</strong>,
          pago <strong>{fallbackPaymentId}</strong>.
        </p>
        <div className="cta-row">
          <Link href="/contacto" className="btn btn-primary">
            Contactar soporte
          </Link>
          <Link href="/marketplace" className="btn btn-ghost">
            Volver al marketplace
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="studio-card checkout-success-card" aria-live="polite">
      <p className="card-label">Cierre de ciclo</p>
      <h2>{statusMessage.title}</h2>
      <p>{statusMessage.body}</p>

      <div className="checkout-success-summary" role="status">
        <h3>Resumen canónico de tu compra</h3>
        <p>
          Te enviamos el comprobante a <strong>{customerEmail}</strong>.
        </p>
        <ul>
          <li>
            <span>ID de pago</span>
            <strong>{summary.payment_id ?? fallbackPaymentId}</strong>
          </li>
          <li>
            <span>Referencia de orden</span>
            <strong>{summary.external_reference ?? fallbackExternalReference}</strong>
          </li>
          <li>
            <span>Estado consolidado</span>
            <strong>{normalizeStatusLabel(summary.consolidated_status)}</strong>
          </li>
          <li>
            <span>Total</span>
            <strong>{toCurrency(total)}</strong>
          </li>
          <li>
            <span>Email</span>
            <strong>{customerEmail}</strong>
          </li>
          <li>
            <span>Método de pago</span>
            <strong>{paymentMethod}</strong>
          </li>
          <li>
            <span>Orden creada (UTC)</span>
            <strong>{formatDate(summary.timestamps?.order_created_at)}</strong>
          </li>
          <li>
            <span>Última actualización de orden (UTC)</span>
            <strong>{formatDate(summary.timestamps?.order_updated_at)}</strong>
          </li>
          <li>
            <span>Último evento de pago (UTC)</span>
            <strong>{formatDate(summary.timestamps?.payment_updated_at ?? summary.timestamps?.payment_created_at)}</strong>
          </li>
        </ul>
      </div>

      <div className="checkout-success-products">
        <h3>Productos</h3>
        {purchasedItems.length ? (
          <div className="checkout-success-table-wrapper">
            <table className="checkout-success-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {purchasedItems.map((item, index) => {
                  const quantity = Number.isFinite(item.quantity) ? Number(item.quantity) : 0;
                  const unitPrice = Number.isFinite(item.unitPrice) ? Number(item.unitPrice) : 0;
                  const subtotal = Number.isFinite(item.subtotal) ? Number(item.subtotal) : quantity * unitPrice;

                  return (
                    <tr key={`${item.slug ?? item.name ?? "item"}-${index}`}>
                      <td data-label="Producto">{item.name ?? item.slug ?? "Producto"}</td>
                      <td data-label="Cantidad">{quantity}</td>
                      <td data-label="Precio unitario">{toCurrency(unitPrice)}</td>
                      <td data-label="Subtotal">{toCurrency(subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            No encontramos ítems en metadata para esta orden. Si necesitas apoyo, comparte tu ID de pago y referencia
            de orden con soporte.
          </p>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="studio-card" role="status" aria-live="polite">
          <p>
            Crear cuenta para ver esta compra en tu historial.
          </p>
          <div className="cta-row">
            <Link
              href={`/login?mode=signup&redirect=${encodeURIComponent(loginRedirectPath)}`}
              className="btn btn-primary"
            >
              Crear cuenta para ver esta compra en tu historial
            </Link>
            <Link href={`/login?redirect=${encodeURIComponent(loginRedirectPath)}`} className="btn btn-ghost">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      ) : (
        <div className="studio-card" role="status" aria-live="polite">
          <p className="card-label">Vinculación de historial</p>
          <h3>Compras y cuenta</h3>
          <p>
            {isClaimingOrders
              ? "Estamos vinculando tus compras con tu cuenta..."
              : claimError
                ? claimError
                : claimMessage ?? "Tu historial está sincronizado."}
          </p>
        </div>
      )}

      <div className="cta-row">
        <Link href="/mi-cuenta/pedidos" className="btn btn-primary">
          Ver mis pedidos
        </Link>
        <Link href="/marketplace" className="btn btn-ghost">
          Volver al marketplace
        </Link>
      </div>
    </section>
  );
}
