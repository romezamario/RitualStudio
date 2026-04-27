import { marketplaceProducts, type MarketplaceProduct } from "@/data/marketplace-products";

const STORAGE_KEY = "ritualstudio.marketplace.products";
const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=80";

export type EditableMarketplaceProductInput = {
  slug?: string;
  name: string;
  description: string;
  image: string;
  hasOffer: boolean;
  price: number;
  offerPrice?: number;
};

export function isBase64DataImageUrl(value: string) {
  return /^data:image\//i.test(value.trim());
}

type SupabaseMarketplaceProductRecord = {
  slug: string;
  name: string;
  category: MarketplaceProduct["category"];
  price: string;
  image: string;
  short_description: string;
  description: string;
  size: string;
  flowers: string[] | null;
  ideal_for: string[] | null;
  delivery: string;
  original_price: string | null;
  has_offer: boolean | null;
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

function toLightweightProduct(product: MarketplaceProduct): MarketplaceProduct {
  return {
    ...product,
    image: isBase64DataImageUrl(product.image) ? DEFAULT_PRODUCT_IMAGE : product.image,
  };
}

export function isLocalMarketplaceFallbackEnabled() {
  return process.env.NEXT_PUBLIC_MARKETPLACE_LOCAL_FALLBACK === "true";
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

export function toSupabaseMarketplaceProductRecord(product: MarketplaceProduct): SupabaseMarketplaceProductRecord {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: product.price,
    image: product.image,
    short_description: product.shortDescription,
    description: product.description,
    size: product.size,
    flowers: product.flowers,
    ideal_for: product.idealFor,
    delivery: product.delivery,
    original_price: product.originalPrice ?? null,
    has_offer: product.hasOffer ?? false,
  };
}

function fromSupabaseMarketplaceProductRecord(record: SupabaseMarketplaceProductRecord): MarketplaceProduct {
  return {
    slug: record.slug,
    name: record.name,
    category: record.category,
    price: record.price,
    image: record.image,
    shortDescription: record.short_description,
    description: record.description,
    size: record.size,
    flowers: record.flowers ?? [],
    idealFor: record.ideal_for ?? [],
    delivery: record.delivery,
    originalPrice: record.original_price ?? undefined,
    hasOffer: record.has_offer ?? false,
  };
}

export async function fetchMarketplaceProductsFromBackend() {
  if (typeof window !== "undefined") {
    return null;
  }

  const { supabaseAdminRequest } = await import("@/lib/supabase-admin");
  const { data, error } = await supabaseAdminRequest<SupabaseMarketplaceProductRecord[]>(
    "/rest/v1/products?select=slug,name,category,price,image,short_description,description,size,flowers,ideal_for,delivery,original_price,has_offer&order=name.asc",
    { method: "GET" },
  );

  if (error || !data) {
    return null;
  }

  if (!data.length) {
    return [];
  }

  return data.map(fromSupabaseMarketplaceProductRecord);
}

export async function getMarketplaceProductsForRender() {
  const backendProducts = await fetchMarketplaceProductsFromBackend();

  if (backendProducts && backendProducts.length > 0) {
    return backendProducts;
  }

  return marketplaceProducts;
}

export async function getMarketplaceProductBySlugForRender(slug: string) {
  const products = await getMarketplaceProductsForRender();
  return products.find((product) => product.slug === slug) ?? null;
}

export function getStoredMarketplaceProducts(): MarketplaceProduct[] {
  if (typeof window === "undefined" || !isLocalMarketplaceFallbackEnabled()) {
    return marketplaceProducts;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return marketplaceProducts;
  }

  try {
    const parsed = JSON.parse(raw) as MarketplaceProduct[];
    const sanitized = parsed.map(toLightweightProduct);
    return sanitized.length ? sanitized : marketplaceProducts;
  } catch {
    return marketplaceProducts;
  }
}

export function saveStoredMarketplaceProducts(products: MarketplaceProduct[]) {
  if (typeof window === "undefined" || !isLocalMarketplaceFallbackEnabled()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products.map(toLightweightProduct)));
}

export function getMarketplaceProduct(slug: string) {
  return getStoredMarketplaceProducts().find((product) => product.slug === slug) ?? null;
}
