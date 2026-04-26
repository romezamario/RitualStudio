import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseClientInfoHeader } from "@/lib/integration-metadata";

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

type Role = "user" | "admin";

type SupabaseAuthResult = {
  error: string | null;
  user: {
    id?: string;
    email: string;
    role: Role;
    username?: string;
    fullName?: string;
  } | null;
  sessionCreated: boolean;
  session: {
    accessToken: string;
    refreshToken: string;
  } | null;
};

type SupabaseErrorPayload = {
  error_description?: string;
  msg?: string;
  error?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type SupabaseUserPayload = {
  id?: string;
  email?: string;
  app_metadata?: {
    role?: string;
    user_role?: string;
  };
  user_metadata?: {
    role?: string;
    user_role?: string;
    username?: string;
    full_name?: string;
    fullName?: string;
  };
  raw_user_meta_data?: {
    role?: string;
    user_role?: string;
    username?: string;
    full_name?: string;
    fullName?: string;
  };
};

type SupabaseSuccessPayload = {
  access_token?: string;
  refresh_token?: string;
  user?: SupabaseUserPayload;
};

type SupabaseVerifyOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

type SupabaseVerifyOtpResult = SupabaseAuthResult;

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

function normalizeUserRole(value: string | undefined): Role {
  const lowered = value?.toLowerCase();

  if (lowered === "admin" || lowered === "administrator") {
    return "admin";
  }

  return "user";
}

function parseSupabaseUser(data: SupabaseSuccessPayload | null) {
  const user = data?.user;

  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: normalizeUserRole(user.app_metadata?.role ?? user.app_metadata?.user_role ?? user.user_metadata?.role ?? user.user_metadata?.user_role),
    username: user.user_metadata?.username ?? user.raw_user_meta_data?.username,
    fullName:
      user.user_metadata?.full_name ??
      user.user_metadata?.fullName ??
      user.raw_user_meta_data?.full_name ??
      user.raw_user_meta_data?.fullName,
  };
}

function parseSession(data: SupabaseSuccessPayload | null) {
  if (!data?.access_token || !data?.refresh_token) {
    return null;
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

function resolveEmailRedirectTo() {
  const callbackPath = "/auth/callback";
  const candidateUrl = publicSiteUrl?.length ? publicSiteUrl : typeof window !== "undefined" ? window.location.origin : null;

  if (!candidateUrl) {
    return undefined;
  }

  try {
    return new URL(callbackPath, candidateUrl).toString();
  } catch {
    return undefined;
  }
}

function resolveRecoveryRedirectTo() {
  const callbackPath = "/auth/callback";
  const candidateUrl = publicSiteUrl?.length ? publicSiteUrl : typeof window !== "undefined" ? window.location.origin : null;

  if (!candidateUrl) {
    return undefined;
  }

  try {
    const url = new URL(callbackPath, candidateUrl);
    url.searchParams.set("next", "/actualizar-contrasena");
    return url.toString();
  } catch {
    return undefined;
  }
}

async function requestSupabaseAuth(
  endpoint: string,
  body: {
    email: string;
    password: string;
    options?: {
      emailRedirectTo?: string;
      data?: { username?: string; full_name?: string };
    };
  },
  fallbackError: string
): Promise<SupabaseAuthResult> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

    const response = await fetch(`${supabaseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "X-Client-Info": getSupabaseClientInfoHeader(),
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => null)) as (SupabaseErrorPayload & SupabaseSuccessPayload) | null;

    if (!response.ok) {
      const parsedError = parseSupabaseError(data, fallbackError);

      if (response.status >= 500) {
        return {
          error: `Supabase devolvió un error interno (${response.status}). Intenta de nuevo en unos minutos.`,
          user: null,
          sessionCreated: false,
          session: null,
        };
      }

      if (response.status === 429) {
        return {
          error: "Demasiados intentos en poco tiempo. Espera unos segundos y vuelve a intentarlo.",
          user: null,
          sessionCreated: false,
          session: null,
        };
      }

      return {
        error: `${parsedError} (HTTP ${response.status})`,
        user: null,
        sessionCreated: false,
        session: null,
      };
    }

    const session = parseSession(data);

    return {
      error: null,
      user: parseSupabaseUser(data),
      sessionCreated: Boolean(session),
      session,
    };
  } catch (error) {
    return {
      error: parseNetworkError(error),
      user: null,
      sessionCreated: false,
      session: null,
    };
  }
}

export async function signInWithPassword(email: string, password: string): Promise<SupabaseAuthResult> {
  return requestSupabaseAuth("/auth/v1/token?grant_type=password", { email, password }, "No fue posible iniciar sesión.");
}

export async function signUpWithPassword(
  email: string,
  password: string,
  profile?: {
    username: string;
    fullName: string;
  }
): Promise<SupabaseAuthResult> {
  const normalizedUsername = profile?.username.trim();
  const normalizedFullName = profile?.fullName.trim();
  const emailRedirectTo = resolveEmailRedirectTo();

  return requestSupabaseAuth(
    "/auth/v1/signup",
    {
      email,
      password,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
        data: {
          ...(normalizedUsername ? { username: normalizedUsername } : {}),
          ...(normalizedFullName ? { full_name: normalizedFullName } : {}),
        },
      },
    },
    "No fue posible crear la cuenta."
  );
}

export async function verifyOtpToken(params: {
  tokenHash: string;
  type: SupabaseVerifyOtpType;
}): Promise<SupabaseVerifyOtpResult> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

    const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "X-Client-Info": getSupabaseClientInfoHeader(),
      },
      body: JSON.stringify({
        token_hash: params.tokenHash,
        type: params.type,
      }),
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as (SupabaseErrorPayload & SupabaseSuccessPayload) | null;

    if (!response.ok) {
      return {
        error: parseSupabaseError(data, "No fue posible confirmar el correo."),
        user: null,
        sessionCreated: false,
        session: null,
      };
    }

    const session = parseSession(data);

    return {
      error: null,
      user: parseSupabaseUser(data),
      sessionCreated: Boolean(session),
      session,
    };
  } catch (error) {
    return {
      error: parseNetworkError(error),
      user: null,
      sessionCreated: false,
      session: null,
    };
  }
}

export async function requestPasswordRecovery(email: string): Promise<{ error: string | null }> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    const emailRedirectTo = resolveRecoveryRedirectTo();

    const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "X-Client-Info": getSupabaseClientInfoHeader(),
      },
      body: JSON.stringify({
        email,
        ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
      }),
    });

    const data = (await response.json().catch(() => null)) as SupabaseErrorPayload | null;

    if (!response.ok) {
      return {
        error: `${parseSupabaseError(data, "No fue posible enviar el enlace de recuperación.")} (HTTP ${response.status})`,
      };
    }

    return { error: null };
  } catch (error) {
    return { error: parseNetworkError(error) };
  }
}

export { hasSupabaseConfig };
