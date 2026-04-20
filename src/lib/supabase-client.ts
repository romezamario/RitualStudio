const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type SupabaseAuthResult = {
  error: string | null;
};

function getSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en variables de entorno.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey
  };
}

export async function signInWithPassword(email: string, password: string): Promise<SupabaseAuthResult> {
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = getSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      error: data.error_description ?? data.msg ?? "No fue posible iniciar sesión."
    };
  }

  return { error: null };
}

export async function signUpWithPassword(email: string, password: string): Promise<SupabaseAuthResult> {
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = getSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      error: data.msg ?? data.error_description ?? "No fue posible crear la cuenta."
    };
  }

  return { error: null };
}

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
