"use client";

import { useMemo, useState } from "react";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import { useCart } from "@/components/cart-context";
import { getWhatsAppHref } from "@/lib/whatsapp";

type ProductPurchaseActionsProps = {
  product: MarketplaceProduct;
};

export default function ProductPurchaseActions({ product }: ProductPurchaseActionsProps) {
  const { addProductToCart } = useCart();
  const [feedback, setFeedback] = useState("");

  const buyNowHref = useMemo(() => {
    const message = `Hola Ritual Studio, quiero comprar \"${product.name}\" (${product.price}).`;
    return getWhatsAppHref(message);
  }, [product.name, product.price]);

  const handleAddToCart = () => {
    addProductToCart(product);
    setFeedback("Producto agregado al carrito");

    window.setTimeout(() => {
      setFeedback("");
    }, 1800);
  };

  return (
    <div className="purchase-actions">
      <button type="button" className="btn btn-ghost" onClick={handleAddToCart}>
        Agregar al carrito
      </button>
      <a className="btn btn-primary" href={buyNowHref} target="_blank" rel="noopener noreferrer">
        Comprar ahora
      </a>
      {feedback ? <p className="cart-feedback">{feedback}</p> : null}
    </div>
  );
}
