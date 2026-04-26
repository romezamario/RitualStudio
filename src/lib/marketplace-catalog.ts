import { marketplaceProducts, type MarketplaceProduct } from "@/data/marketplace-products";

const STORAGE_KEY = "ritualstudio.marketplace.products";

export type EditableMarketplaceProductInput = {
  slug?: string;
  name: string;
  description: string;
  image: string;
  hasOffer: boolean;
  price: number;
  offerPrice?: number;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function formatCurrency(value: number) {
  return `$${new Intl.NumberFormat("es-MX").format(value)} MXN`;
}

export function buildMarketplaceProduct(input: EditableMarketplaceProductInput): MarketplaceProduct {
  const resolvedSlug = input.slug && input.slug.trim() ? slugify(input.slug) : slugify(input.name);
  const finalPrice = input.hasOffer && input.offerPrice ? input.offerPrice : input.price;
  const safeSlug = resolvedSlug || `producto-${Date.now()}`;
  const shortDescription = input.description.trim().slice(0, 120);

  return {
    slug: safeSlug,
    name: input.name.trim(),
    category: "Ramos",
    price: formatCurrency(finalPrice),
    image: input.image,
    shortDescription: shortDescription || "Producto floral creado por administración.",
    description: input.description.trim(),
    size: "Personalizable",
    flowers: ["Según temporada"],
    idealFor: ["Regalo", "Decoración"],
    delivery: "Coordinar entrega por WhatsApp según cobertura.",
    originalPrice: input.hasOffer ? formatCurrency(input.price) : undefined,
    hasOffer: input.hasOffer,
  };
}

export function getStoredMarketplaceProducts(): MarketplaceProduct[] {
  if (typeof window === "undefined") {
    return marketplaceProducts;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return marketplaceProducts;
  }

  try {
    const parsed = JSON.parse(raw) as MarketplaceProduct[];
    return parsed.length ? parsed : marketplaceProducts;
  } catch {
    return marketplaceProducts;
  }
}

export function saveStoredMarketplaceProducts(products: MarketplaceProduct[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function getMarketplaceProduct(slug: string) {
  return getStoredMarketplaceProducts().find((product) => product.slug === slug) ?? null;
}
