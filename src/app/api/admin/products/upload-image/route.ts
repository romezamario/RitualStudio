import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import {
  buildSupabaseStoragePublicUrl,
  getProductImagesBucket,
  isLikelyHttpUrl,
  normalizeProductImageReference,
  toRenderableProductImageUrl,
} from "@/lib/product-image-storage";

type ProductImageVariant = "thumb" | "card" | "detail";

type UploadImageResult = {
  variant: ProductImageVariant | "original";
  objectPath: string;
  publicUrl: string;
  renderUrl: string;
};
type ImageMetadataInsert = {
  product_slug: string | null;
  product_id: string | null;
  admin_user_id: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number;
  mime_type: string;
  original_filename: string;
  storage_path: string;
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/webp", "image/avif", "image/png"]);
const BLOCKED_IMAGE_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/tiff",
  "image/bmp",
  "image/gif",
  "image/svg+xml",
]);

const VARIANT_CONFIG: Array<{ name: ProductImageVariant; width: number; quality: number }> = [
  { name: "thumb", width: 320, quality: 70 },
  { name: "card", width: 720, quality: 78 },
  { name: "detail", width: 1440, quality: 84 },
];

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)+/g, "")
    .toLowerCase();
}

function sanitizeStorageSegment(value: string) {
  const sanitized = sanitizeFileName(value).replace(/\.+/g, "-");
  return sanitized || randomUUID();
}

async function assertAdmin() {
  const { user, isAdmin } = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  return null;
}

function buildObjectPath(entityKey: string, fileName: string) {
  return `catalog/${entityKey}/${fileName}`;
}

function toUploadResult(variant: UploadImageResult["variant"], objectPath: string): UploadImageResult {
  const normalizedPath = normalizeProductImageReference(objectPath);
  const publicUrl = buildSupabaseStoragePublicUrl(normalizedPath);
  const renderUrl = isLikelyHttpUrl(publicUrl) ? publicUrl : toRenderableProductImageUrl(normalizedPath);

  return {
    variant,
    objectPath: normalizedPath,
    publicUrl,
    renderUrl,
  };
}

async function uploadObjectToStorage(params: {
  supabaseUrl: string;
  serviceRoleKey: string;
  bucket: string;
  objectPath: string;
  body: Blob;
  contentType: string;
}) {
  return fetch(
    `${params.supabaseUrl}/storage/v1/object/${params.bucket}/${encodeURIComponent(params.objectPath).replace(/%2F/g, "/")}`,
    {
      method: "POST",
      headers: {
        apikey: params.serviceRoleKey,
        Authorization: `Bearer ${params.serviceRoleKey}`,
        "Content-Type": params.contentType,
        "x-upsert": "true",
      },
      body: params.body,
      cache: "no-store",
    },
  );
}

export async function POST(request: Request) {
  const guard = await assertAdmin();

  if (guard) {
    return guard;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se encontró un archivo válido en el campo file." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten archivos de imagen." }, { status: 400 });
  }

  if (BLOCKED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error:
          "Formato no recomendado para web. Usa JPG, WEBP o AVIF para mantener peso y rendimiento en catálogo.",
      },
      { status: 400 },
    );
  }

  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error:
          "Formato no soportado para carga de catálogo. Formatos permitidos: image/jpeg, image/webp, image/avif, image/png.",
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "La imagen excede el límite de 8MB." }, { status: 400 });
  }


  const optimizationHint =
    file.size > 2 * 1024 * 1024
      ? "Archivo pesado detectado: se optimizó automáticamente para catálogo (WEBP en variantes)."
      : null;

  const rawSlug = typeof formData?.get("slug") === "string" ? String(formData.get("slug")) : "";
  const rawProductId = typeof formData?.get("productId") === "string" ? String(formData.get("productId")) : "";
  const metadataWidth = Number(formData?.get("width"));
  const metadataHeight = Number(formData?.get("height"));
  const processedMimeType = typeof formData?.get("processed_mime_type") === "string" ? String(formData.get("processed_mime_type")) : "";
  const originalFilename = typeof formData?.get("original_filename") === "string" ? String(formData.get("original_filename")) : file.name;
  const entityKey = sanitizeStorageSegment(rawSlug || rawProductId || `${Date.now()}-${randomUUID()}`);
  const safeName = sanitizeFileName(file.name || "producto");
  const bucket = getProductImagesBucket();

  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };

  const sourceExtension = extensionByType[file.type] ?? "bin";
  const sourcePath = buildObjectPath(entityKey, `original-${safeName || "producto"}.${sourceExtension}`);

  const originalUpload = await uploadObjectToStorage({
    supabaseUrl,
    serviceRoleKey,
    bucket,
    objectPath: sourcePath,
    body: file,
    contentType: file.type || "application/octet-stream",
  });

  if (!originalUpload.ok) {
    const errorBody = (await originalUpload.json().catch(() => null)) as { message?: string } | null;
    return NextResponse.json(
      {
        error:
          errorBody?.message ??
          "No fue posible subir la imagen original. Verifica bucket/permisos de Supabase Storage.",
      },
      { status: 500 },
    );
  }

  const transformedVariants = await Promise.all(
    VARIANT_CONFIG.map(async (variant) => {
      const renderUrl = `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${encodeURIComponent(sourcePath).replace(/%2F/g, "/")}?width=${variant.width}&quality=${variant.quality}&format=webp`;

      const rendered = await fetch(renderUrl, {
        method: "GET",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        cache: "no-store",
      });

      if (!rendered.ok) {
        const errorBody = await rendered.text().catch(() => "");
        throw new Error(`No fue posible generar variante ${variant.name}. ${errorBody}`.trim());
      }

      const variantBlob = await rendered.blob();
      const variantPath = buildObjectPath(entityKey, `${variant.name}.webp`);
      const uploaded = await uploadObjectToStorage({
        supabaseUrl,
        serviceRoleKey,
        bucket,
        objectPath: variantPath,
        body: variantBlob,
        contentType: "image/webp",
      });

      if (!uploaded.ok) {
        const errorBody = (await uploaded.json().catch(() => null)) as { message?: string } | null;
        throw new Error(
          errorBody?.message ?? `No fue posible subir la variante ${variant.name} al bucket ${bucket}.`,
        );
      }

      return toUploadResult(variant.name, variantPath);
    }),
  ).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Error desconocido al generar variantes.";
    return message;
  });

  if (typeof transformedVariants === "string") {
    return NextResponse.json(
      {
        error: transformedVariants,
      },
      { status: 500 },
    );
  }

  const variants = Object.fromEntries(transformedVariants.map((item) => [item.variant, item.objectPath])) as Record<
    ProductImageVariant,
    string
  >;

  const metadataPayload: ImageMetadataInsert = {
    product_slug: rawSlug || null,
    product_id: rawProductId || null,
    admin_user_id: null,
    width: Number.isFinite(metadataWidth) && metadataWidth > 0 ? Math.round(metadataWidth) : null,
    height: Number.isFinite(metadataHeight) && metadataHeight > 0 ? Math.round(metadataHeight) : null,
    size_bytes: file.size,
    mime_type: processedMimeType || file.type || "application/octet-stream",
    original_filename: sanitizeFileName(originalFilename || "imagen"),
    storage_path: variants.detail,
  };

  await fetch(`${supabaseUrl}/rest/v1/product_image_uploads`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(metadataPayload),
    cache: "no-store",
  });

  return NextResponse.json(
    {
      data: {
        image: variants.detail,
        folder: `catalog/${entityKey}`,
        variants,
        assets: {
          original: toUploadResult("original", sourcePath),
          thumb: transformedVariants.find((item) => item.variant === "thumb") ?? null,
          card: transformedVariants.find((item) => item.variant === "card") ?? null,
          detail: transformedVariants.find((item) => item.variant === "detail") ?? null,
        },
        db: {
          image: variants.detail,
          imageVariants: variants,
        },
        optimizationHint,
      },
    },
    { status: 201 },
  );
}
