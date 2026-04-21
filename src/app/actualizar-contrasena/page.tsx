"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/site-shell";

function evaluatePassword(value: string) {
  return {
    hasUppercase: /[A-Z]/.test(value),
    hasLowercase: /[a-z]/.test(value),
    hasDigit: /\d/.test(value),
    hasSpecialCharacter: /[^A-Za-z0-9]/.test(value),
    hasMinLength: value.length >= 6,
  };
}

export default function ActualizarContrasenaPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordChecks = useMemo(() => evaluatePassword(password), [password]);
  const isStrongPassword = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isStrongPassword) {
      setErrorMessage("La contraseña debe cumplir todos los criterios de seguridad.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setErrorMessage(data?.error ?? "No fue posible actualizar tu contraseña.");
        return;
      }

      setSuccessMessage("Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage("No fue posible actualizar tu contraseña. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SiteShell
      eyebrow="Recuperación"
      title="Crea una nueva contraseña"
      subtitle="Estás en el paso final de recuperación. Define una contraseña segura para volver a entrar a tu cuenta."
    >
      <form className="studio-form" onSubmit={handleSubmit}>
        <label>
          Nueva contraseña
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </label>

        <label>
          Confirmar nueva contraseña
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Vuelve a escribir tu contraseña"
            required
          />
        </label>

        <ul className="password-rules" aria-live="polite">
          <li className={`password-rule ${passwordChecks.hasUppercase ? "is-valid" : ""}`}>
            {passwordChecks.hasUppercase ? "✅" : "⬜"} Al menos una mayúscula
          </li>
          <li className={`password-rule ${passwordChecks.hasLowercase ? "is-valid" : ""}`}>
            {passwordChecks.hasLowercase ? "✅" : "⬜"} Al menos una minúscula
          </li>
          <li className={`password-rule ${passwordChecks.hasDigit ? "is-valid" : ""}`}>
            {passwordChecks.hasDigit ? "✅" : "⬜"} Al menos un dígito
          </li>
          <li className={`password-rule ${passwordChecks.hasSpecialCharacter ? "is-valid" : ""}`}>
            {passwordChecks.hasSpecialCharacter ? "✅" : "⬜"} Al menos un caracter especial
          </li>
          <li className={`password-rule ${passwordChecks.hasMinLength ? "is-valid" : ""}`}>
            {passwordChecks.hasMinLength ? "✅" : "⬜"} Mínimo 6 caracteres
          </li>
        </ul>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </form>

      {errorMessage ? <p className="auth-feedback auth-feedback-error">{errorMessage}</p> : null}
      {successMessage ? (
        <div className="auth-feedback auth-feedback-success">
          <p>{successMessage}</p>
          <div className="cta-row">
            <Link href="/login" className="btn btn-primary">
              Ir al login
            </Link>
          </div>
        </div>
      ) : null}
    </SiteShell>
  );
}
