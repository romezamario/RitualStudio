const DEFAULT_PRODUCT_IMAGES_BUCKET = "product-images";

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

export function toRenderableProductImageUrl(image: string) {
  const normalized = normalizeProductImageReference(image);

  if (!normalized) {
    return "";
  }

  if (isLikelyHttpUrl(normalized)) {
    return normalized;
  }

  return buildSupabaseStoragePublicUrl(normalized);
}
