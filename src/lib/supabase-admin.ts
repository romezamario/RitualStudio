import { getSupabaseClientInfoHeader } from "@/lib/integration-metadata";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

type SupabaseErrorPayload = {
  message?: string;
  code?: string;
  hint?: string;
  details?: string;
};

function toSupabaseErrorMessage(status: number, body: SupabaseErrorPayload | null) {
  const baseMessage = body?.message ?? `Supabase error: ${status}`;
  const normalizedMessage = baseMessage.toLowerCase();

  if (
    body?.code === "PGRST205" ||
    (normalizedMessage.includes("public.products") && normalizedMessage.includes("schema"))
  ) {
    return "La tabla public.products no existe en Supabase. Ejecuta la migración pendiente para crearla y vuelve a intentar.";
  }

  const metadata = [body?.hint, body?.details].filter(Boolean).join(" · ");
  return metadata ? `${baseMessage} (${metadata})` : baseMessage;
}

export async function supabaseAdminRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      data: null,
      error: "Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      "X-Client-Info": getSupabaseClientInfoHeader(),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as T | SupabaseErrorPayload | null;

  if (!response.ok) {
    return {
      data: null,
      error: toSupabaseErrorMessage(response.status, body as SupabaseErrorPayload | null),
    };
  }

  return {
    data: body as T,
    error: null,
  };
}
