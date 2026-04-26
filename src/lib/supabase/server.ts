import { cookies } from "next/headers";
import type { User } from "@/lib/supabase/types";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseClientInfoHeader } from "@/lib/integration-metadata";

const ACCESS_TOKEN_COOKIE = "sb-access-token";
const REFRESH_TOKEN_COOKIE = "sb-refresh-token";

export type UserProfile = {
  id: string;
  email: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

type SupabaseAuthUserResponse = {
  id: string;
  email: string;
};

export async function getServerSessionTokens() {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  };
}

export async function getUserFromAccessToken(accessToken: string | null): Promise<User | null> {
  if (!accessToken) {
    return null;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      "X-Client-Info": getSupabaseClientInfoHeader(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json().catch(() => null)) as SupabaseAuthUserResponse | null;

  if (!data?.id || !data?.email) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
  };
}

export async function getUserProfileById(userId: string, accessToken: string): Promise<UserProfile | null> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const url = new URL(`${supabaseUrl}/rest/v1/profiles`);
  url.searchParams.set("select", "id,email,role,created_at,updated_at");
  url.searchParams.set("id", `eq.${userId}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      "X-Client-Info": getSupabaseClientInfoHeader(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json().catch(() => null)) as UserProfile[] | null;

  return data?.[0] ?? null;
}

export async function getCurrentUserProfile() {
  const { accessToken } = await getServerSessionTokens();
  const user = await getUserFromAccessToken(accessToken);

  if (!user || !accessToken) {
    return {
      user: null,
      profile: null,
      isAdmin: false,
    };
  }

  const profile = await getUserProfileById(user.id, accessToken);

  return {
    user,
    profile,
    isAdmin: profile?.role === "admin",
  };
}

export const sessionCookieNames = {
  access: ACCESS_TOKEN_COOKIE,
  refresh: REFRESH_TOKEN_COOKIE,
};
