"use client";

import { useEffect, useRef } from "react";
import { useAuth, type UserRole } from "@/components/auth-context";

type EmailConfirmationSyncProps = {
  email: string | null;
  role: string | null;
  username: string | null;
  fullName: string | null;
  session: string | null;
};

function normalizeRole(role: string | null): UserRole {
  const lowered = role?.toLowerCase();
  if (lowered === "admin" || lowered === "administrator") {
    return "admin";
  }

  return "customer";
}

export function EmailConfirmationSync({ email, role, username, fullName, session }: EmailConfirmationSyncProps) {
  const { signIn } = useAuth();
  const didSync = useRef(false);

  useEffect(() => {
    if (didSync.current) {
      return;
    }

    if (session !== "1" || !email) {
      return;
    }

    signIn({
      email,
      role: normalizeRole(role),
      ...(username ? { username } : {}),
      ...(fullName ? { fullName } : {}),
    });

    didSync.current = true;
  }, [email, fullName, role, session, signIn, username]);

  return null;
}
