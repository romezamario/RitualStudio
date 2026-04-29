const DEFAULT_PRODUCT_IMAGES_BUCKET = "product-images";

export type ProductImageVariant = "thumb" | "card" | "detail" | "original";

export type ProductImageRenderUsage =
  | "marketplace-list"
  | "product-card"
  | "product-detail"
  | "cart-item"
  | "admin-preview"
  | "original-download";

type ProductImageVariantContract = {
  width: number;
  height: number;
  quality: number;
  usage: string;
};

type ProductImageRenderPreset = {
  variant: ProductImageVariant;
};

export const PRODUCT_IMAGE_VARIANT_CONTRACT: Record<ProductImageVariant, ProductImageVariantContract> = {
  thumb: { width: 320, height: 240, quality: 70, usage: "Miniaturas en listados densos y previews pequeñas." },
  card: { width: 720, height: 540, quality: 78, usage: "Cards de catálogo (marketplace, cursos y tarjetas)." },
  detail: { width: 1440, height: 1080, quality: 84, usage: "PDP y vistas de detalle con imagen protagonista." },
  original: { width: 0, height: 0, quality: 100, usage: "Solo para acciones explícitas (descarga/revisión)." },
};

const PRODUCT_IMAGE_RENDER_PRESETS: Record<ProductImageRenderUsage, ProductImageRenderPreset> = {
  "marketplace-list": { variant: "thumb" },
  "product-card": { variant: "card" },
  "product-detail": { variant: "detail" },
  "cart-item": { variant: "thumb" },
  "admin-preview": { variant: "card" },
  "original-download": { variant: "original" },
};

export function getProductImagesBucket() {
  return process.env.SUPABASE_PRODUCT_IMAGES_BUCKET?.trim() || DEFAULT_PRODUCT_IMAGES_BUCKET;
}

export function isDataImageUrl(value: string) {
  return value.trim().toLowerCase().startsWith("data:image/");
}

export function isLikelyHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function buildSupabaseStoragePublicUrl(path: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\/$/, "");

  if (!supabaseUrl) {
    return "";
  }

  const normalizedPath = path.replace(/^\/+/, "");
  return `${supabaseUrl}/storage/v1/object/public/${getProductImagesBucket()}/${normalizedPath}`;
}

export function buildSupabaseStorageRenderUrl(path: string, usage: ProductImageRenderUsage) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\/$/, "");

  if (!supabaseUrl) {
    return "";
  }

  const normalizedPath = path.replace(/^\/+/, "");
  const preset = PRODUCT_IMAGE_RENDER_PRESETS[usage];

  if (preset.variant === "original") {
    return buildSupabaseStoragePublicUrl(normalizedPath);
  }

  const variant = PRODUCT_IMAGE_VARIANT_CONTRACT[preset.variant];
  const searchParams = new URLSearchParams({
    width: String(variant.width),
    height: String(variant.height),
    quality: String(variant.quality),
  });

  return `${supabaseUrl}/storage/v1/render/image/public/${getProductImagesBucket()}/${normalizedPath}?${searchParams.toString()}`;
}

export function normalizeProductImageReference(image: string) {
  const trimmed = image.trim();

  if (!trimmed || isDataImageUrl(trimmed)) {
    return "";
  }

  if (isLikelyHttpUrl(trimmed)) {
    return trimmed;
  }

  return trimmed.replace(/^\/+/, "");
}

export function toRenderableProductImageUrl(image: string, usage: ProductImageRenderUsage = "product-detail") {
  const normalized = normalizeProductImageReference(image);

  if (!normalized) {
    return "";
  }

  if (isLikelyHttpUrl(normalized)) {
    return normalized;
  }

  return buildSupabaseStorageRenderUrl(normalized, usage);
}
