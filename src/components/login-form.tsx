"use client";

import { FormEvent, useState } from "react";
import { useAuth, type UserRole } from "@/components/auth-context";
import { hasSupabaseConfig, signInWithPassword, signUpWithPassword } from "@/lib/supabase-client";

type AuthMode = "login" | "signup";

export function LoginForm() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
        const { error, user } = await signInWithPassword(email, password);

        if (error) {
          setErrorMessage(error);
        } else {
          signIn({
            email: user?.email ?? email,
            role: user?.role ?? "customer",
            username: user?.username,
            fullName: user?.fullName,
          });
          setSuccessMessage("Inicio de sesión exitoso. Ya puedes navegar a tus funciones desde el menú de usuario.");
        }
      }

      if (mode === "signup") {
        const { error, user, sessionCreated } = await signUpWithPassword(email, password, selectedRole, {
          username,
          fullName,
        });

        if (error) {
          setErrorMessage(error);
        } else if (sessionCreated) {
          signIn({
            email: user?.email ?? email,
            role: user?.role ?? selectedRole,
            username: user?.username ?? username.trim(),
            fullName: user?.fullName ?? fullName.trim(),
          });
          setSuccessMessage("Cuenta creada e iniciada correctamente. Ya puedes usar el menú de usuario.");
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

            <label>
              Tipo de cuenta inicial
              <select
                className="input"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value as UserRole)}
              >
                <option value="customer">Usuario normal</option>
                <option value="admin">Administrador</option>
              </select>
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

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </form>

      {errorMessage ? <p className="auth-feedback auth-feedback-error">{errorMessage}</p> : null}
      {successMessage ? <p className="auth-feedback auth-feedback-success">{successMessage}</p> : null}
    </>
  );
}
