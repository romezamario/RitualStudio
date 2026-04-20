"use client";

import { FormEvent, useState } from "react";
import { hasSupabaseConfig, signInWithPassword, signUpWithPassword } from "@/lib/supabase-client";

type AuthMode = "login" | "signup";

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasSupabaseConfig()) {
      setErrorMessage(
        "Faltan variables de entorno de Supabase. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)."
      );
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signInWithPassword(email, password);

        if (error) {
          setErrorMessage(error);
        } else {
          setSuccessMessage("Inicio de sesión exitoso. Ya puedes avanzar a rutas protegidas en el siguiente paso.");
        }
      }

      if (mode === "signup") {
        const { error } = await signUpWithPassword(email, password);

        if (error) {
          setErrorMessage(error);
        } else {
          setSuccessMessage("Cuenta creada. Revisa tu correo para confirmar el registro si tu proyecto tiene confirmación por email activada.");
        }
      }
    } catch {
      setErrorMessage("No fue posible conectar con Supabase. Verifica URL, key y conectividad.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="cta-row">
        <button
          type="button"
          className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMode("login")}
        >
          Ya tengo cuenta
        </button>
        <button
          type="button"
          className={`btn ${mode === "signup" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMode("signup")}
        >
          Crear cuenta
        </button>
      </div>

      <form className="studio-form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu-correo@ejemplo.com"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            className="input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </form>

      {errorMessage ? <p className="auth-feedback auth-feedback-error">{errorMessage}</p> : null}
      {successMessage ? <p className="auth-feedback auth-feedback-success">{successMessage}</p> : null}
    </>
  );
}
