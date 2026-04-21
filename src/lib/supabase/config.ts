const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export function getSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan variables de Supabase. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  const normalizedUrl = supabaseUrl
    .replace(/\/+$/, "")
    .replace(/\/auth\/v1$/i, "")
    .replace(/\/rest\/v1$/i, "");

  try {
    const parsedUrl = new URL(normalizedUrl);

    if (!parsedUrl.protocol.startsWith("http")) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL no tiene un formato válido. Debe verse como: https://<project-ref>.supabase.co"
    );
  }

  return {
    supabaseUrl: normalizedUrl,
    supabaseAnonKey,
  };
}

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
