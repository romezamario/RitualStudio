const DEFAULT_PRODUCT_IMAGES_BUCKET = "product-images";

export type ProductImageRenderUsage = "marketplace-card" | "product-detail" | "cart" | "admin-preview";

type ProductImageRenderPreset = {
  width: number;
  height?: number;
  quality: number;
};

const PRODUCT_IMAGE_RENDER_PRESETS: Record<ProductImageRenderUsage, ProductImageRenderPreset> = {
  "marketplace-card": { width: 960, height: 720, quality: 76 },
  "product-detail": { width: 1440, height: 1080, quality: 84 },
  cart: { width: 360, height: 252, quality: 72 },
  "admin-preview": { width: 800, height: 600, quality: 74 },
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

  const searchParams = new URLSearchParams({
    width: String(preset.width),
    quality: String(preset.quality),
  });

  if (preset.height) {
    searchParams.set("height", String(preset.height));
  }

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
