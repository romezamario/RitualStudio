import { NextResponse } from "next/server";
import { getServerSessionTokens } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

type PasswordBody = {
  password?: string;
};

function isStrongPassword(value: string) {
  return /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PasswordBody | null;
  const password = body?.password?.trim() ?? "";

  if (password.length < 6 || !isStrongPassword(password)) {
    return NextResponse.json(
      {
        error:
          "La nueva contraseña debe tener mínimo 6 caracteres e incluir mayúsculas, minúsculas, dígitos y caracteres especiales.",
      },
      { status: 400 }
    );
  }

  const { accessToken } = await getServerSessionTokens();

  if (!accessToken) {
    return NextResponse.json({ error: "Tu sesión de recuperación expiró. Solicita un nuevo enlace." }, { status: 401 });
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "No fue posible actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez." },
      { status: response.status }
    );
  }

  return NextResponse.json({ ok: true });
}
