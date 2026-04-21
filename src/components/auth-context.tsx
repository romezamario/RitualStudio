"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "user" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthMePayload = {
  user: {
    id: string;
    email: string;
  } | null;
  profile: {
    role: UserRole;
  } | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshAuth = useCallback(async () => {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      setUser(null);
      return;
    }

    const payload = (await response.json()) as AuthMePayload;

    if (!payload.user) {
      setUser(null);
      return;
    }

    setUser({
      id: payload.user.id,
      email: payload.user.email,
      role: payload.profile?.role ?? "user",
    });
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", {
      method: "DELETE",
    });

    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      refreshAuth,
      signOut,
    }),
    [refreshAuth, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
