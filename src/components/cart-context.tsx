"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { MarketplaceProduct } from "@/data/marketplace-products";

const CART_STORAGE_KEY = "ritual-studio-cart";
const MAX_PRODUCT_QUANTITY_PER_LINE = 10;
const MAX_COURSE_PARTICIPANTS_PER_LINE = 6;

export type ProductCartItem = {
  kind: "product";
  slug: MarketplaceProduct["slug"];
  name: MarketplaceProduct["name"];
  price: MarketplaceProduct["price"];
  image: MarketplaceProduct["image"];
  category: MarketplaceProduct["category"];
  quantity: number;
};

export type CourseCartItem = {
  kind: "course";
  slug: string;
  courseId: string;
  courseSessionId: string;
  sessionStartsAt: string;
  name: string;
  price: string;
  image: string;
  category: "Curso";
  quantity: number;
};

export type CartItem = ProductCartItem | CourseCartItem;

export type AddCourseToCartInput = {
  slug: string;
  courseId: string;
  courseSessionId: string;
  sessionStartsAt: string;
  name: string;
  unitPrice: string;
  image: string;
  participants: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  addProductToCart: (product: MarketplaceProduct) => void;
  addCourseToCart: (input: AddCourseToCartInput) => void;
  removeFromCart: (lineKey: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function clampQuantityByKind(kind: CartItem["kind"], quantity: number) {
  const cap = kind === "course" ? MAX_COURSE_PARTICIPANTS_PER_LINE : MAX_PRODUCT_QUANTITY_PER_LINE;
  return Math.min(Math.max(quantity, 1), cap);
}

export function getCartItemLineKey(item: { kind: CartItem["kind"]; slug: string; courseSessionId?: string }) {
  if (item.kind === "course") {
    return `course:${item.slug}:${item.courseSessionId}`;
  }

  return `product:${item.slug}`;
}

function sanitizeCartItems(rawItems: unknown): CartItem[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const maybeKind = "kind" in entry && (entry.kind === "product" || entry.kind === "course") ? entry.kind : "product";
      const maybeSlug = "slug" in entry ? String(entry.slug) : "";
      const maybeName = "name" in entry ? String(entry.name) : "";
      const maybePrice = "price" in entry ? String(entry.price) : "";
      const maybeImage = "image" in entry ? String(entry.image) : "";
      const maybeCategory = "category" in entry ? String(entry.category) : "";
      const maybeQuantity = "quantity" in entry ? Number(entry.quantity) : 0;

      if (!maybeSlug || !maybeName || !maybePrice || !maybeImage || !Number.isInteger(maybeQuantity) || maybeQuantity < 1) {
        return null;
      }

      if (maybeKind === "course") {
        const maybeCourseId = "courseId" in entry ? String(entry.courseId) : "";
        const maybeCourseSessionId = "courseSessionId" in entry ? String(entry.courseSessionId) : "";
        const maybeSessionStartsAt = "sessionStartsAt" in entry ? String(entry.sessionStartsAt) : "";

        if (!maybeCourseId || !maybeCourseSessionId || !maybeSessionStartsAt) {
          return null;
        }

        return {
          kind: "course" as const,
          slug: maybeSlug,
          courseId: maybeCourseId,
          courseSessionId: maybeCourseSessionId,
          sessionStartsAt: maybeSessionStartsAt,
          name: maybeName,
          price: maybePrice,
          image: maybeImage,
          category: "Curso" as const,
          quantity: clampQuantityByKind("course", maybeQuantity),
        };
      }

      if (!maybeCategory) {
        return null;
      }

      return {
        kind: "product" as const,
        slug: maybeSlug,
        name: maybeName,
        price: maybePrice,
        image: maybeImage,
        category: maybeCategory as MarketplaceProduct["category"],
        quantity: clampQuantityByKind("product", maybeQuantity),
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
      addProductToCart: (product) => {
        setItems((currentItems) => {
          const existingItem = currentItems.find((entry) => entry.kind === "product" && entry.slug === product.slug);

          if (existingItem) {
            return currentItems.map((entry) =>
              entry.kind === "product" && entry.slug === product.slug
                ? { ...entry, quantity: clampQuantityByKind("product", entry.quantity + 1) }
                : entry,
            );
          }

          return [
            ...currentItems,
            {
              kind: "product",
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category,
              quantity: 1,
            },
          ];
        });
      },
      addCourseToCart: (input) => {
        setItems((currentItems) => {
          const existingItem = currentItems.find(
            (entry) =>
              entry.kind === "course" &&
              entry.courseId === input.courseId &&
              entry.courseSessionId === input.courseSessionId &&
              entry.slug === input.slug,
          );

          if (existingItem) {
            return currentItems.map((entry) =>
              entry.kind === "course" &&
              entry.courseId === input.courseId &&
              entry.courseSessionId === input.courseSessionId &&
              entry.slug === input.slug
                ? {
                    ...entry,
                    quantity: clampQuantityByKind("course", entry.quantity + input.participants),
                  }
                : entry,
            );
          }

          return [
            ...currentItems,
            {
              kind: "course",
              slug: input.slug,
              courseId: input.courseId,
              courseSessionId: input.courseSessionId,
              sessionStartsAt: input.sessionStartsAt,
              name: input.name,
              price: input.unitPrice,
              image: input.image,
              category: "Curso",
              quantity: clampQuantityByKind("course", input.participants),
            },
          ];
        });
      },
      removeFromCart: (lineKey) => {
        setItems((currentItems) => currentItems.filter((item) => getCartItemLineKey(item) !== lineKey));
      },
      clearCart: () => {
        setItems([]);
      },
    }),
    [items],
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
