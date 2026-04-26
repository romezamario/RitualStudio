import { getSupabaseClientInfoHeader } from "@/lib/integration-metadata";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

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

  const body = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    return {
      data: null,
      error: (body as { message?: string } | null)?.message ?? `Supabase error: ${response.status}`,
    };
  }

  return {
    data: body as T,
    error: null,
  };
}
