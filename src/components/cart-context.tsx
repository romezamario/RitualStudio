"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { MarketplaceProduct } from "@/data/marketplace-products";

const CART_STORAGE_KEY = "ritual-studio-cart";

export type CartItem = {
  slug: MarketplaceProduct["slug"];
  name: MarketplaceProduct["name"];
  price: MarketplaceProduct["price"];
  image: MarketplaceProduct["image"];
  category: MarketplaceProduct["category"];
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  addToCart: (product: MarketplaceProduct) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
      return;
    }

    try {
      const parsed = JSON.parse(rawCart) as CartItem[];
      setItems(parsed);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      addToCart: (product) => {
        setItems((currentItems) => {
          const item = currentItems.find((entry) => entry.slug === product.slug);

          if (item) {
            return currentItems.map((entry) =>
              entry.slug === product.slug ? { ...entry, quantity: entry.quantity + 1 } : entry
            );
          }

          return [
            ...currentItems,
            {
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category,
              quantity: 1
            }
          ];
        });
      },
      removeFromCart: (slug) => {
        setItems((currentItems) => currentItems.filter((item) => item.slug !== slug));
      },
      clearCart: () => {
        setItems([]);
      }
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}
