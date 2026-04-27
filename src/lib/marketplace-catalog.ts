import { marketplaceProducts, type MarketplaceProduct } from "@/data/marketplace-products";
import { normalizeProductImageReference } from "@/lib/product-image-storage";

const STORAGE_KEY = "ritualstudio.marketplace.products";
const MARKETPLACE_PUBLIC_CACHE_REVALIDATE_SECONDS = 300;


export type EditableMarketplaceProductInput = {
  slug?: string;
  name: string;
  description: string;
  image: string;
  hasOffer: boolean;
  price: number;
  offerPrice?: number;
};

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
    image: normalizeProductImageReference(input.image),
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

export async function fetchPublicMarketplaceProductsFromBackend() {
  if (typeof window !== "undefined") {
    return null;
  }

  const { supabasePublicReadRequest } = await import("@/lib/supabase-public");
  const { data, error } = await supabasePublicReadRequest<SupabaseMarketplaceProductRecord[]>(
    "/rest/v1/products?select=slug,name,category,price,image,short_description,description,size,flowers,ideal_for,delivery,original_price,has_offer&order=name.asc",
    {
      next: {
        revalidate: MARKETPLACE_PUBLIC_CACHE_REVALIDATE_SECONDS,
        tags: ["marketplace-products"],
      },
    },
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
  const backendProducts = await fetchPublicMarketplaceProductsFromBackend();

  if (backendProducts && backendProducts.length > 0) {
    return backendProducts;
  }

  return marketplaceProducts;
}

export async function getMarketplaceProductBySlugForRender(slug: string) {
  const products = await getMarketplaceProductsForRender();
  return products.find((product) => product.slug === slug) ?? null;
}

function sanitizeProductForLocalStorage(product: MarketplaceProduct): MarketplaceProduct {
  const normalizedImage = normalizeProductImageReference(product.image);

  return {
    ...product,
    image: normalizedImage || "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=80",
  };
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
    const sanitized = parsed.map(sanitizeProductForLocalStorage);
    return sanitized.length ? sanitized : marketplaceProducts;
  } catch {
    return marketplaceProducts;
  }
}

export function saveStoredMarketplaceProducts(products: MarketplaceProduct[]) {
  if (typeof window === "undefined" || !isLocalMarketplaceFallbackEnabled()) {
    return;
  }

  const lightweightProducts = products.map(sanitizeProductForLocalStorage);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightProducts));
}

export function getMarketplaceProduct(slug: string) {
  return getStoredMarketplaceProducts().find((product) => product.slug === slug) ?? null;
}
