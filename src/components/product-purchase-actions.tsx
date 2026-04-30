"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import { useCart } from "@/components/cart-context";

type ProductPurchaseActionsProps = {
  product: MarketplaceProduct;
};

export default function ProductPurchaseActions({ product }: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { addProductToCart } = useCart();
  const [feedback, setFeedback] = useState("");

  const handleAddToCart = () => {
    addProductToCart(product);
    setFeedback("Producto agregado al carrito");

    window.setTimeout(() => {
      setFeedback("");
    }, 1800);
  };

  const handleBuyNow = () => {
    addProductToCart(product);
    router.push("/checkout");
  };

  return (
    <div className="purchase-actions">
      <button type="button" className="btn btn-ghost" onClick={handleAddToCart}>
        Agregar al carrito
      </button>
      <button type="button" className="btn btn-primary" onClick={handleBuyNow}>
        Comprar ahora
      </button>
      {feedback ? <p className="cart-feedback">{feedback}</p> : null}
    </div>
  );
}
