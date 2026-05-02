"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDateTimeMx } from "@/lib/date-time";

type AdminCourseSession = {
  id: string;
  courseId: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number;
  reservedSpots: number;
  isActive: boolean;
};

type AdminCourse = {
  id: string;
  title: string;
  sessions: AdminCourseSession[];
};

type SessionFormState = {
  startsAt: string;
  endsAt: string;
  capacity: string;
  isActive: boolean;
};

const initialSessionForm: SessionFormState = { startsAt: "", endsAt: "", capacity: "", isActive: true };

const toDateTimeInputValue = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const toIsoDateTime = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export default function AdminCourseSessionsManager({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(initialSessionForm);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const sortedSessions = useMemo(
    () => [...(course?.sessions ?? [])].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [course?.sessions],
  );

  useEffect(() => {
    let ignore = false;
    const loadCourse = async () => {
      try {
        const response = await fetch("/api/admin/courses", { method: "GET" });
        const body = (await response.json().catch(() => null)) as { data?: AdminCourse[]; error?: string } | null;
        if (!response.ok) throw new Error(body?.error ?? "No fue posible cargar cursos.");
        if (ignore) return;
        const selected = body?.data?.find((item) => item.id === courseId) ?? null;
        setCourse(selected);
        setFeedback(selected ? "" : "Curso no encontrado.");
      } catch (error) {
        if (!ignore) setFeedback(error instanceof Error ? error.message : "No fue posible cargar el curso.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void loadCourse();
    return () => {
      ignore = true;
    };
  }, [courseId]);

  const resetSessionForm = () => {
    setSessionForm(initialSessionForm);
    setEditingSessionId(null);
  };

  const handleSessionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startsAt = toIsoDateTime(sessionForm.startsAt);
    const endsAt = toIsoDateTime(sessionForm.endsAt);
    const capacity = Number(sessionForm.capacity);
    if (!startsAt) return setFeedback("Ingresa una fecha/hora de inicio válida.");
    if (sessionForm.endsAt && !endsAt) return setFeedback("La fecha/hora de término no es válida.");
    if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) return setFeedback("La sesión debe terminar después de iniciar.");
    if (!Number.isInteger(capacity) || capacity <= 0) return setFeedback("Ingresa un cupo entero mayor a 0.");

    try {
      const endpoint = editingSessionId ? `/api/admin/courses/sessions/${editingSessionId}` : `/api/admin/courses/${courseId}/sessions`;
      const response = await fetch(endpoint, {
        method: editingSessionId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startsAt, endsAt, capacity, isActive: sessionForm.isActive }),
      });
      const body = (await response.json().catch(() => null)) as { data?: AdminCourseSession; error?: string } | null;
      if (!response.ok || !body?.data) throw new Error(body?.error ?? "No fue posible guardar la sesión.");
      setCourse((current) => {
        if (!current) return current;
        const nextSessions = editingSessionId
          ? current.sessions.map((session) => (session.id === editingSessionId ? body.data! : session))
          : [...current.sessions, body.data!];
        return { ...current, sessions: nextSessions };
      });
      resetSessionForm();
      setFeedback(editingSessionId ? "Sesión actualizada correctamente." : "Sesión creada correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible guardar la sesión.");
    }
  };

  const startSessionEdit = (session: AdminCourseSession) => {
    setEditingSessionId(session.id);
    setSessionForm({
      startsAt: toDateTimeInputValue(session.startsAt),
      endsAt: toDateTimeInputValue(session.endsAt),
      capacity: String(session.capacity),
      isActive: session.isActive,
    });
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/courses/sessions/${sessionId}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "No fue posible eliminar la sesión.");
      setCourse((current) => (current ? { ...current, sessions: current.sessions.filter((s) => s.id !== sessionId) } : current));
      if (editingSessionId === sessionId) resetSessionForm();
      setFeedback("Sesión eliminada correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible eliminar la sesión.");
    }
  };

  return (
    <section className="studio-card">
      <p className="card-label">Sesiones</p>
      <h2>{course ? `Sesiones de ${course.title}` : "Sesiones del curso"}</h2>
      <div className="cta-row">
        <Link href="/admin/cursos" className="btn btn-ghost">Volver a cursos</Link>
      </div>
      {loading ? <p>Cargando curso...</p> : null}
      {!loading && !course ? <p>No existe el curso solicitado.</p> : null}
      {course ? <>
        <form className="studio-form admin-product-form" onSubmit={(event) => void handleSessionSubmit(event)}>
          <label>Inicio<input required type="datetime-local" value={sessionForm.startsAt} onChange={(event) => setSessionForm((c) => ({ ...c, startsAt: event.target.value }))} /></label>
          <label>Término (opcional)<input type="datetime-local" value={sessionForm.endsAt} onChange={(event) => setSessionForm((c) => ({ ...c, endsAt: event.target.value }))} /></label>
          <label>Cupo<input required type="number" min="1" value={sessionForm.capacity} onChange={(event) => setSessionForm((c) => ({ ...c, capacity: event.target.value }))} /></label>
          <label><input type="checkbox" checked={sessionForm.isActive} onChange={(event) => setSessionForm((c) => ({ ...c, isActive: event.target.checked }))} /> Sesión activa</label>
          <div className="cta-row"><button type="submit" className="btn btn-primary">{editingSessionId ? "Guardar sesión" : "Crear sesión"}</button>{editingSessionId ? <button type="button" className="btn btn-ghost" onClick={resetSessionForm}>Cancelar edición</button> : null}</div>
        </form>
        <div className="admin-product-list">
          {sortedSessions.map((session) => <article key={session.id} className="studio-card"><h3>{formatDateTimeMx(session.startsAt)}</h3><p>Fin: {session.endsAt ? formatDateTimeMx(session.endsAt) : "No definido"}</p><p>Cupo: {session.capacity} · Reservados: {session.reservedSpots}</p><p>Estatus: {session.isActive ? "Activa" : "Inactiva"}</p><div className="cta-row"><button type="button" className="btn btn-ghost" onClick={() => startSessionEdit(session)}>Editar sesión</button><button type="button" className="btn btn-ghost" onClick={() => void deleteSession(session.id)}>Eliminar sesión</button></div></article>)}
          {!sortedSessions.length ? <p>No hay sesiones para este curso.</p> : null}
        </div>
      </> : null}
      {feedback ? <p>{feedback}</p> : null}
    </section>
  );
}
