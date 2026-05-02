"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { getCartItemLineKey, useCart } from "@/components/cart-context";
import { getWhatsAppHref } from "@/lib/whatsapp";
import { toRenderableProductImageUrl } from "@/lib/product-image-storage";
import { formatDateTimeMx } from "@/lib/date-time";

const CART_IMAGE_SIZES = "(max-width: 900px) 100vw, 180px";

function formatCourseSessionDate(startsAt: string) {
  return formatDateTimeMx(startsAt, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CartPageClient() {
  const { items, removeFromCart, clearCart, totalItems } = useCart();

  const checkoutHref = useMemo(() => {
    if (!items.length) {
      return getWhatsAppHref("Hola Ritual Studio, quiero cotizar productos del marketplace.");
    }

    const lines = items
      .map((item) => {
        if (item.kind === "course") {
          return `• Curso: ${item.name} · Sesión: ${formatCourseSessionDate(item.sessionStartsAt)} · Participantes: ${item.quantity} (${item.price} c/u)`;
        }

        return `• Producto: ${item.name} x${item.quantity} (${item.price})`;
      })
      .join("\n");

    const message = `Hola Ritual Studio, quiero comprar:
${lines}`;

    return getWhatsAppHref(message);
  }, [items]);

  if (!items.length) {
    return (
      <section className="studio-card cart-empty">
        <h2>Tu carrito está vacío</h2>
        <p>Explora el marketplace y agrega productos para continuar con tu compra.</p>
        <Link href="/marketplace" className="btn btn-primary">
          Ir al marketplace
        </Link>
      </section>
    );
  }

  return (
    <section className="cart-layout" aria-label="Productos y cursos agregados al carrito">
      <div className="cart-items">
        {items.map((item) => {
          const lineKey = getCartItemLineKey(item);
          const imageSource =
            item.kind === "product"
              ? toRenderableProductImageUrl(item.image, "cart-item")
              : item.image.startsWith("http") || item.image.startsWith("/")
                ? item.image
                : toRenderableProductImageUrl(item.image, "cart-item");

          return (
            <article key={lineKey} className="studio-card cart-item">
              <div className="cart-item-image-wrap">
                <Image
                  src={imageSource}
                  alt={item.name}
                  width={600}
                  height={420}
                  className="cart-item-image"
                  sizes={CART_IMAGE_SIZES}
                />
              </div>
              <div className="cart-item-copy">
                <p className="card-label">{item.kind === "course" ? "Curso" : item.category}</p>
                <h3>{item.name}</h3>
                {item.kind === "course" ? (
                  <>
                    <p>Sesión: {formatCourseSessionDate(item.sessionStartsAt)}</p>
                    <p>Participantes: {item.quantity}</p>
                    <p>Precio unitario: {item.price}</p>
                  </>
                ) : (
                  <p>Cantidad: {item.quantity}</p>
                )}
                <strong className="price-tag">{item.price}</strong>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => removeFromCart(lineKey)}>
                Quitar
              </button>
            </article>
          );
        })}
      </div>

      <aside className="studio-card cart-summary">
        <p className="card-label">Resumen</p>
        <h2>Ver carrito de compras</h2>
        <p>Ítems agregados: {totalItems}</p>

        <div className="cta-row">
          <Link className="btn btn-primary" href="/checkout">
            Pagar con tarjeta
          </Link>
          <a className="btn btn-ghost" href={checkoutHref} target="_blank" rel="noopener noreferrer">
            Comprar por WhatsApp
          </a>
          <button type="button" className="btn btn-ghost" onClick={clearCart}>
            Vaciar carrito
          </button>
        </div>
      </aside>
    </section>
  );
}
