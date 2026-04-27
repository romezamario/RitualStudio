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

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)+/g, "")
    .toLowerCase();
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

  const maxFileSizeBytes = 8 * 1024 * 1024;

  if (file.size > maxFileSizeBytes) {
    return NextResponse.json({ error: "La imagen excede el límite de 8MB." }, { status: 400 });
  }

  const bucket = getProductImagesBucket();
  const timestamp = Date.now();
  const safeName = sanitizeFileName(file.name || "producto");
  const objectPath = `catalog/${timestamp}-${randomUUID()}-${safeName || "producto"}`;

  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(objectPath).replace(/%2F/g, "/")}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
      cache: "no-store",
    },
  );

  if (!uploadResponse.ok) {
    const errorBody = (await uploadResponse.json().catch(() => null)) as { message?: string } | null;
    return NextResponse.json(
      {
        error:
          errorBody?.message ??
          "No fue posible subir la imagen. Verifica que el bucket exista y que la política permita escritura desde backend.",
      },
      { status: 500 },
    );
  }

  const normalizedPath = normalizeProductImageReference(objectPath);
  const publicUrl = buildSupabaseStoragePublicUrl(normalizedPath);
  const renderUrl = isLikelyHttpUrl(publicUrl) ? publicUrl : toRenderableProductImageUrl(normalizedPath);

  return NextResponse.json(
    {
      data: {
        image: normalizedPath,
        publicUrl,
        renderUrl,
      },
    },
    { status: 201 },
  );
}
