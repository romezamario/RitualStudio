const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

type SupabaseAuthResult = {
  error: string | null;
};

type SupabaseErrorPayload = {
  error_description?: string;
  msg?: string;
  error?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function getSupabaseConfig() {
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

function parseSupabaseError(data: SupabaseErrorPayload | null, fallbackError: string) {
  if (!data) {
    return fallbackError;
  }

  return data.error_description ?? data.msg ?? data.error ?? data.message ?? data.details ?? data.hint ?? fallbackError;
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

    const data = (await response.json().catch(() => null)) as SupabaseErrorPayload | null;

    if (!response.ok) {
      const parsedError = parseSupabaseError(data, fallbackError);

      if (response.status >= 500) {
        return {
          error: `Supabase devolvió un error interno (${response.status}). Intenta de nuevo en unos minutos.`
        };
      }

      if (response.status === 429) {
        return {
          error: "Demasiados intentos en poco tiempo. Espera unos segundos y vuelve a intentarlo."
        };
      }

      return {
        error: `${parsedError} (HTTP ${response.status})`
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
