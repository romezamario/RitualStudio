import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/supabase/server";

const STORAGE_BUCKET = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET?.trim() || "product-images";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function normalizeFileName(fileName: string) {
  const trimmed = fileName.trim().toLowerCase();
  const noAccents = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sanitized = noAccents.replace(/[^a-z0-9.-]+/g, "-").replace(/(^-|-$)+/g, "");
  return sanitized || "image";
}

function getExtension(fileName: string, contentType: string) {
  const fromName = fileName.split(".").pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) {
    return fromName;
  }

  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/avif") return "avif";
  return "jpg";
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
    return NextResponse.json({ error: "No se recibió archivo de imagen." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "El archivo debe ser una imagen válida." }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "La imagen debe pesar entre 1 byte y 5 MB." }, { status: 400 });
  }

  const safeBaseName = normalizeFileName(file.name).replace(/\.[a-z0-9]{2,5}$/i, "");
  const extension = getExtension(file.name, file.type);
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const filePath = `catalog/${fileName}`;

  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${filePath}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorBody = (await uploadResponse.json().catch(() => null)) as { message?: string } | null;
    return NextResponse.json(
      { error: errorBody?.message ?? "No fue posible subir la imagen a Supabase Storage." },
      { status: 500 },
    );
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`;

  return NextResponse.json(
    {
      data: {
        bucket: STORAGE_BUCKET,
        path: filePath,
        publicUrl,
      },
    },
    { status: 201 },
  );
}
