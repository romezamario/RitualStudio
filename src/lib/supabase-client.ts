const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

type SupabaseAuthResult = {
  error: string | null;
};

function getSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en variables de entorno.");
  }

  const normalizedUrl = supabaseUrl.replace(/\/+$/, "");

  try {
    new URL(normalizedUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no tiene un formato válido.");
  }

  return {
    supabaseUrl: normalizedUrl,
    supabaseAnonKey
  };
}

function parseNetworkError(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message.includes("Failed to fetch")) {
      return "No fue posible conectar con Supabase. Verifica URL, key y conectividad.";
    }

    return error.message;
  }

  return "No fue posible conectar con Supabase. Verifica URL, key y conectividad.";
}

async function requestSupabaseAuth(endpoint: string, body: { email: string; password: string }, fallbackError: string) {
  try {
    const { supabaseUrl: url, supabaseAnonKey: anonKey } = getSupabaseConfig();

    const response = await fetch(`${url}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error:
          data?.error_description ??
          data?.msg ??
          data?.error ??
          fallbackError
      };
    }

    return { error: null };
  } catch (error) {
    return {
      error: parseNetworkError(error)
    };
  }
}

export async function signInWithPassword(email: string, password: string): Promise<SupabaseAuthResult> {
  return requestSupabaseAuth("/auth/v1/token?grant_type=password", { email, password }, "No fue posible iniciar sesión.");
}

export async function signUpWithPassword(email: string, password: string): Promise<SupabaseAuthResult> {
  return requestSupabaseAuth("/auth/v1/signup", { email, password }, "No fue posible crear la cuenta.");
}

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
