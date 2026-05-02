"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_superuser: boolean;
};

export default function AdminUsersManager() {
  const [email, setEmail] = useState("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

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

  const handleDeactivateAdmin = async (admin: AdminUser) => {
    setProcessingUserId(admin.id);
    setFeedback("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: admin.id }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "No fue posible dar de baja al administrador.");
      }

      setFeedback(body?.message ?? "Administrador dado de baja correctamente.");
      await loadAdmins();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible dar de baja al administrador.");
    } finally {
      setProcessingUserId(null);
    }
  };

  return (
    <div className="studio-card admin-users-card">
      <p className="card-label">Panel admin</p>
      <h2>Administradores registrados</h2>
      <p>Total de administradores: <strong>{admins.length}</strong></p>

      <form onSubmit={handleSubmit} className="admin-users-form" style={{ marginTop: 16 }}>
        <label className="admin-users-label">
          Correo del usuario administrador
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@ritualstudio.mx"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Guardando..." : "Dar de alta administrador"}
        </button>
      </form>

      {feedback ? <p style={{ marginTop: 12 }}>{feedback}</p> : null}

      {loading ? <p style={{ marginTop: 16 }}>Cargando administradores...</p> : null}
      {!loading && admins.length === 0 ? <p style={{ marginTop: 16 }}>No hay administradores registrados.</p> : null}

      {!loading && admins.length > 0 ? (
        <div className="admin-users-table-wrap" style={{ marginTop: 16, overflowX: "auto" }}>
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Opciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.full_name?.trim() ? admin.full_name : "(sin nombre)"}</td>
                  <td>{admin.email ?? "(sin correo)"}</td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => void handleDeactivateAdmin(admin)}
                      disabled={processingUserId === admin.id || admin.is_superuser}
                      title={admin.is_superuser ? "Los superusuarios no pueden darse de baja desde este módulo." : undefined}
                    >
                      {processingUserId === admin.id
                        ? "Procesando..."
                        : admin.is_superuser
                          ? "Superusuario protegido"
                          : "Dar de baja"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
