"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string | null;
};

export default function AdminUsersManager() {
  const [email, setEmail] = useState("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { method: "GET" });
      const body = (await response.json().catch(() => null)) as { data?: AdminUser[]; error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "No fue posible cargar administradores.");
      }

      setAdmins(body?.data ?? []);
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible cargar administradores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdmins();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setFeedback("Ingresa el correo del usuario.");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "No fue posible dar de alta al administrador.");
      }

      setEmail("");
      setFeedback(body?.message ?? "Administrador dado de alta correctamente.");
      await loadAdmins();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible dar de alta al administrador.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="studio-card">
      <p className="card-label">Panel admin</p>
      <h2>Administradores registrados</h2>
      <p>Total de administradores: <strong>{admins.length}</strong></p>

      <form onSubmit={handleSubmit} className="admin-form-grid" style={{ marginTop: 16 }}>
        <label>
          Correo del usuario administrador
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@ritualstudio.mx"
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Dar de alta administrador"}
        </button>
      </form>

      {feedback ? <p style={{ marginTop: 12 }}>{feedback}</p> : null}

      <ul style={{ marginTop: 16 }}>
        {loading ? <li>Cargando administradores...</li> : null}
        {!loading && admins.length === 0 ? <li>No hay administradores registrados.</li> : null}
        {admins.map((admin) => (
          <li key={admin.id}>{admin.email ?? "(sin correo)"}</li>
        ))}
      </ul>
    </div>
  );
}
