import { getSupabaseClientInfoHeader } from "@/lib/integration-metadata";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\/$/, "");
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

type SupabaseErrorPayload = {
  message?: string;
};

type SupabasePublicReadRequestOptions = Pick<RequestInit, "next">;

export async function supabasePublicReadRequest<T>(
  path: string,
  options: SupabasePublicReadRequestOptions = {},
): Promise<{ data: T | null; error: string | null }> {
  if (!supabaseUrl || !publishableKey) {
    return {
      data: null,
      error: "Faltan variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    };
  }

  const response = await fetch(`${supabaseUrl}${path}`, {
    method: "GET",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
      "X-Client-Info": getSupabaseClientInfoHeader(),
    },
    next: options.next,
  });

  const body = (await response.json().catch(() => null)) as T | SupabaseErrorPayload | null;

  if (!response.ok) {
    return {
      data: null,
      error: (body as SupabaseErrorPayload | null)?.message ?? `Supabase error: ${response.status}`,
    };
  }

  return {
    data: body as T,
    error: null,
  };
}
