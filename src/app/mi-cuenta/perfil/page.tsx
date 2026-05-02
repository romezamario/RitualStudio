"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import SiteShell from "@/components/site-shell";

type FormState = {
  email: string;
  full_name: string;
  phone: string;
};

export default function AccountProfilePage() {
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const [form, setForm] = useState<FormState>({ email: "", full_name: "", phone: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      email: user.email ?? "",
      full_name: user.fullName ?? "",
      phone: user.phone ?? "",
    });
  }, [user]);

  const canSubmit = useMemo(() => isAuthenticated && !isSaving, [isAuthenticated, isSaving]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setErrorMessage(payload?.error ?? "No pudimos actualizar tu perfil. Inténtalo nuevamente.");
      setIsSaving(false);
      return;
    }

    await refreshAuth();
    setSuccessMessage("Perfil actualizado correctamente.");
    setIsSaving(false);
  }

  if (!isAuthenticated) {
    return (
      <SiteShell
        eyebrow="Mi cuenta"
        title="Mi perfil"
        subtitle="Inicia sesión para editar tus datos personales y mantener tu cuenta siempre actualizada."
      >
        <article className="studio-card stack-sm">
          <p className="card-label">Perfil</p>
          <h2>Inicia sesión para editar tu perfil</h2>
          <Link href="/login" className="btn btn-primary">
            Ir a iniciar sesión
          </Link>
        </article>
      </SiteShell>
    );
  }

  return (
    <SiteShell
      eyebrow="Mi cuenta"
      title="Actualiza tus datos"
      subtitle="Mantén tu información de contacto al día para agilizar compras, entregas y notificaciones de tu cuenta."
    >
      <article className="studio-card account-profile-card stack-md">
        <p className="card-label">Perfil</p>

        <form onSubmit={handleSubmit} className="account-profile-form stack-md" noValidate>
          <div className="account-profile-grid">
            <label className="stack-xs" htmlFor="profile-email">
              <span>Correo</span>
              <input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="tu-correo@ejemplo.com"
                required
              />
            </label>

            <label className="stack-xs" htmlFor="profile-full-name">
              <span>Nombre completo</span>
              <input
                id="profile-full-name"
                type="text"
                value={form.full_name}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                placeholder="Tu nombre completo"
              />
            </label>

            <label className="stack-xs" htmlFor="profile-phone">
              <span>Teléfono</span>
              <input
                id="profile-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+52 55 1234 5678"
              />
            </label>
          </div>

          {errorMessage ? <p className="auth-feedback auth-feedback-error" role="alert">{errorMessage}</p> : null}
          {successMessage ? <p className="auth-feedback auth-feedback-success" role="status">{successMessage}</p> : null}

          <div className="button-row">
            <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link href="/mi-cuenta" className="btn btn-ghost">
              Volver a mi cuenta
            </Link>
          </div>
        </form>
      </article>
    </SiteShell>
  );
}
