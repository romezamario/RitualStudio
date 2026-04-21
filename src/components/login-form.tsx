"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { hasSupabaseConfig, requestPasswordRecovery, signInWithPassword, signUpWithPassword } from "@/lib/supabase-client";

type AuthMode = "login" | "signup";

async function persistServerSession(session: { accessToken: string; refreshToken: string }) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    throw new Error("No fue posible guardar la sesión segura.");
  }
}

export function LoginForm() {
  const { refreshAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const redirectPath = searchParams.get("redirect");
  const postLoginPath =
    redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/mi-cuenta";
  const passwordChecks = {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecialCharacter: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

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

    if (mode === "signup" && !isPasswordStrong) {
      setErrorMessage("La contraseña debe incluir mayúsculas, minúsculas, dígitos y caracteres especiales.");
      return;
    }

    if (mode === "signup" && (!username.trim() || !fullName.trim())) {
      setErrorMessage("Para crear cuenta completa los campos de usuario y nombre.");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error, session } = await signInWithPassword(email, password);

        if (error) {
          setErrorMessage(error);
        } else if (session) {
          await persistServerSession(session);
          await refreshAuth();
          router.push(postLoginPath);
        }
      }

      if (mode === "signup") {
        const { error, sessionCreated, session } = await signUpWithPassword(email, password, {
          username,
          fullName,
        });

        if (error) {
          setErrorMessage(error);
        } else if (sessionCreated && session) {
          await persistServerSession(session);
          await refreshAuth();
          router.push(postLoginPath);
        } else {
          setSuccessMessage(
            "Cuenta creada. Revisa tu correo y confirma tu registro para completar el acceso a Ritual Studio."
          );
        }
      }
    } catch {
      setErrorMessage("No fue posible conectar con Supabase. Verifica URL, key y conectividad.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasSupabaseConfig()) {
      setErrorMessage(
        "Faltan variables de entorno de Supabase. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)."
      );
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Ingresa tu correo para enviarte el enlace de recuperación.");
      return;
    }

    setIsRecoveryLoading(true);

    try {
      const { error } = await requestPasswordRecovery(email.trim());

      if (error) {
        setErrorMessage(error);
      } else {
        setSuccessMessage(
          "Te enviamos un enlace para recuperar tu contraseña. Revisa tu correo y sigue el enlace para crear una nueva."
        );
        setIsRecoveryMode(false);
      }
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  return (
    <>
      <div className="cta-row">
        <button
          type="button"
          className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => {
            setMode("login");
            setIsRecoveryMode(false);
          }}
        >
          Ya tengo cuenta
        </button>
        <button
          type="button"
          className={`btn ${mode === "signup" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => {
            setMode("signup");
            setIsRecoveryMode(false);
          }}
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

        {!isRecoveryMode ? (
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
        ) : null}
        {mode === "signup" ? (
          <>
            <label>
              Usuario
              <input
                className="input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="ritual.usuario"
                required
              />
            </label>

            <label>
              Nombre completo
              <input
                className="input"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Tu nombre"
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
            </ul>
          </>
        ) : null}

        {isRecoveryMode && mode === "login" ? (
          <div className="cta-row">
            <button type="button" className="btn btn-primary" disabled={isRecoveryLoading} onClick={handlePasswordRecovery}>
              {isRecoveryLoading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setIsRecoveryMode(false);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
            >
              Volver al login
            </button>
          </div>
        ) : (
          <>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
            {mode === "login" ? (
              <button
                type="button"
                className="btn btn-link"
                onClick={() => {
                  setIsRecoveryMode(true);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            ) : null}
          </>
        )}
      </form>

      {errorMessage ? <p className="auth-feedback auth-feedback-error">{errorMessage}</p> : null}
      {successMessage ? <p className="auth-feedback auth-feedback-success">{successMessage}</p> : null}
    </>
  );
}
