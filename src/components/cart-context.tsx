"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { marketplaceProducts, type MarketplaceProduct } from "@/data/marketplace-products";

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

function sanitizeCartItems(rawItems: unknown): CartItem[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  const productBySlug = new Map(marketplaceProducts.map((product) => [product.slug, product]));

  return rawItems
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const maybeSlug = "slug" in entry ? String(entry.slug) : "";
      const maybeQuantity = "quantity" in entry ? Number(entry.quantity) : 0;

      if (!maybeSlug || !Number.isInteger(maybeQuantity) || maybeQuantity < 1 || maybeQuantity > 10) {
        return null;
      }

      const product = productBySlug.get(maybeSlug as MarketplaceProduct["slug"]);

      if (!product) {
        return null;
      }

      return {
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: maybeQuantity,
      };
    })
    .filter((item): item is CartItem => item !== null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(rawCart) as unknown;
      setItems(sanitizeCartItems(parsed));
    } catch {
      setItems([]);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [isHydrated, items]);

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
