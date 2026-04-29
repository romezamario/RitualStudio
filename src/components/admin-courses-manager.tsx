"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toRenderableProductImageUrl } from "@/lib/product-image-storage";
import { MAX_UPLOAD_IMAGE_BYTES, processImageBeforeUpload } from "@/lib/client-image-processing";

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
  slug: string;
  title: string;
  description: string | null;
  price: number;
  isActive: boolean;
  imageUrl: string | null;
  sessions: AdminCourseSession[];
};

type CourseFormState = {
  slug: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  isActive: boolean;
};

type SessionFormState = {
  startsAt: string;
  endsAt: string;
  capacity: string;
  isActive: boolean;
};

const initialCourseForm: CourseFormState = {
  slug: "",
  title: "",
  description: "",
  price: "",
  imageUrl: "",
  isActive: true,
};

const ADMIN_PREVIEW_IMAGE_SIZES = "(max-width: 900px) 100vw, 50vw";


const initialSessionForm: SessionFormState = {
  startsAt: "",
  endsAt: "",
  capacity: "",
  isActive: true,
};

const toDateTimeInputValue = (value: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const toIsoDateTime = (value: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

export default function AdminCoursesManager() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [courseForm, setCourseForm] = useState<CourseFormState>(initialCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [sessionForms, setSessionForms] = useState<Record<string, SessionFormState>>({});
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadCourses = async () => {
      try {
        const response = await fetch("/api/admin/courses", { method: "GET" });
        const body = (await response.json().catch(() => null)) as { data?: AdminCourse[]; error?: string } | null;

        if (!response.ok) {
          throw new Error(body?.error ?? "No fue posible cargar cursos.");
        }

        if (!ignore) {
          const nextCourses = body?.data ?? [];
          setCourses(nextCourses);

          if (!selectedCourseId && nextCourses[0]?.id) {
            setSelectedCourseId(nextCourses[0].id);
          }

          setFeedback("");
        }
      } catch (error) {
        if (!ignore) {
          setFeedback(error instanceof Error ? error.message : "No fue posible cargar cursos.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadCourses();

    return () => {
      ignore = true;
    };
  }, [selectedCourseId]);

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.title.localeCompare(b.title, "es-MX")),
    [courses],
  );

  const selectedCourse = sortedCourses.find((course) => course.id === selectedCourseId) ?? null;

  const resetCourseForm = () => {
    setCourseForm(initialCourseForm);
    setEditingCourseId(null);
  };

  const resetSessionForm = (courseId: string) => {
    setSessionForms((current) => ({ ...current, [courseId]: initialSessionForm }));
    setEditingSessionId(null);
  };

  const handleCourseSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUploadingImage) {
      setFeedback("Espera a que termine la subida de imagen.");
      return;
    }

    const parsedPrice = Number(courseForm.price);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFeedback("Ingresa un precio válido mayor a 0.");
      return;
    }

    try {
      const response = await fetch(editingCourseId ? `/api/admin/courses/${editingCourseId}` : "/api/admin/courses", {
        method: editingCourseId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: courseForm.slug,
          title: courseForm.title,
          description: courseForm.description,
          price: parsedPrice,
          imageUrl: courseForm.imageUrl,
          isActive: courseForm.isActive,
        }),
      });

      const body = (await response.json().catch(() => null)) as { data?: AdminCourse; error?: string } | null;

      if (!response.ok || !body?.data) {
        throw new Error(body?.error ?? "No fue posible guardar el curso.");
      }

      const nextCourses = editingCourseId
        ? courses.map((course) => (course.id === editingCourseId ? body.data! : course))
        : [body.data, ...courses];

      setCourses(nextCourses);
      setSelectedCourseId(body.data.id);
      resetCourseForm();
      setFeedback(editingCourseId ? "Curso actualizado correctamente." : "Curso creado correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible guardar el curso.");
    }
  };

  const handleImageUpload = async (file?: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback("Selecciona un archivo de imagen válido (JPG, PNG, WEBP o AVIF).");
      return;
    }

    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      setFeedback("La imagen supera el límite de 8MB. Reduce el tamaño antes de subirla.");
      return;
    }

    setIsUploadingImage(true);
    setFeedback("Procesando imagen...");

    try {
      const processed = await processImageBeforeUpload(file);
      const payload = new FormData();
      payload.set("file", processed.file);
      payload.set("width", String(processed.width));
      payload.set("height", String(processed.height));
      payload.set("processed_mime_type", processed.outputMimeType);
      payload.set("original_filename", processed.originalFilename);

      setFeedback("Subiendo imagen del curso...");
      const response = await fetch("/api/admin/products/upload-image", {
        method: "POST",
        body: payload,
      });

      const body = (await response.json().catch(() => null)) as
        | { data?: { image?: string; publicUrl?: string; renderUrl?: string; optimizationHint?: string }; error?: string }
        | null;

      if (!response.ok || !body?.data?.image) {
        throw new Error(body?.error ?? "No fue posible subir la imagen del curso.");
      }

      setCourseForm((current) => ({ ...current, imageUrl: body.data?.image ?? "" }));
      setFeedback(body?.data?.optimizationHint ?? "Imagen subida correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible subir la imagen del curso.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const startCourseEdit = (course: AdminCourse) => {
    setEditingCourseId(course.id);
    setCourseForm({
      slug: course.slug,
      title: course.title,
      description: course.description ?? "",
      price: String(course.price),
      imageUrl: course.imageUrl ?? "",
      isActive: course.isActive,
    });
  };

  const deleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "No fue posible eliminar el curso.");
      }

      const nextCourses = courses.filter((course) => course.id !== courseId);
      setCourses(nextCourses);

      if (selectedCourseId === courseId) {
        setSelectedCourseId(nextCourses[0]?.id ?? null);
      }

      if (editingCourseId === courseId) {
        resetCourseForm();
      }

      setFeedback("Curso eliminado correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible eliminar el curso.");
    }
  };

  const handleSessionSubmit = async (event: React.FormEvent<HTMLFormElement>, courseId: string) => {
    event.preventDefault();

    const form = sessionForms[courseId] ?? initialSessionForm;
    const startsAt = toIsoDateTime(form.startsAt);
    const endsAt = toIsoDateTime(form.endsAt);
    const capacity = Number(form.capacity);

    if (!startsAt) {
      setFeedback("Ingresa una fecha/hora de inicio válida.");
      return;
    }

    if (form.endsAt && !endsAt) {
      setFeedback("La fecha/hora de término no es válida.");
      return;
    }

    if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setFeedback("La sesión debe terminar después de iniciar.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      setFeedback("Ingresa un cupo entero mayor a 0.");
      return;
    }

    try {
      const endpoint = editingSessionId
        ? `/api/admin/courses/sessions/${editingSessionId}`
        : `/api/admin/courses/${courseId}/sessions`;

      const response = await fetch(endpoint, {
        method: editingSessionId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt,
          endsAt,
          capacity,
          isActive: form.isActive,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { data?: AdminCourseSession; error?: string }
        | null;

      if (!response.ok || !body?.data) {
        throw new Error(body?.error ?? "No fue posible guardar la sesión.");
      }

      const nextCourses = courses.map((course) => {
        if (course.id !== courseId) {
          return course;
        }

        const nextSessions = editingSessionId
          ? course.sessions.map((session) => (session.id === editingSessionId ? body.data! : session))
          : [...course.sessions, body.data!];

        return {
          ...course,
          sessions: nextSessions.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
        };
      });

      setCourses(nextCourses);
      resetSessionForm(courseId);
      setFeedback(editingSessionId ? "Sesión actualizada correctamente." : "Sesión creada correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible guardar la sesión.");
    }
  };

  const startSessionEdit = (courseId: string, session: AdminCourseSession) => {
    setEditingSessionId(session.id);
    setSessionForms((current) => ({
      ...current,
      [courseId]: {
        startsAt: toDateTimeInputValue(session.startsAt),
        endsAt: toDateTimeInputValue(session.endsAt),
        capacity: String(session.capacity),
        isActive: session.isActive,
      },
    }));
  };

  const deleteSession = async (courseId: string, sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/courses/sessions/${sessionId}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "No fue posible eliminar la sesión.");
      }

      const nextCourses = courses.map((course) => {
        if (course.id !== courseId) {
          return course;
        }

        return {
          ...course,
          sessions: course.sessions.filter((session) => session.id !== sessionId),
        };
      });

      setCourses(nextCourses);

      if (editingSessionId === sessionId) {
        resetSessionForm(courseId);
      }

      setFeedback("Sesión eliminada correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible eliminar la sesión.");
    }
  };

  return (
    <div className="split-panel admin-products-layout">
      <section className="studio-card">
        <p className="card-label">Cursos</p>
        <h2>{editingCourseId ? "Editar curso" : "Crear curso"}</h2>

        <form className="studio-form admin-product-form" onSubmit={handleCourseSubmit}>
          <label>
            Título del curso
            <input
              required
              value={courseForm.title}
              onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>

          <label>
            Slug (opcional)
            <input
              value={courseForm.slug}
              onChange={(event) => setCourseForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="curso-floral-avanzado"
            />
          </label>

          <label>
            Descripción
            <textarea
              rows={4}
              value={courseForm.description}
              onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <label>
            Precio (MXN)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={courseForm.price}
              onChange={(event) => setCourseForm((current) => ({ ...current, price: event.target.value }))}
            />
          </label>

          <label>
            Imagen del curso
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void handleImageUpload(event.target.files?.[0])}
              disabled={isUploadingImage}
            />
          </label>

          {isUploadingImage ? <p>Subiendo imagen...</p> : null}

          {courseForm.imageUrl ? (
            <Image
              src={toRenderableProductImageUrl(courseForm.imageUrl, "admin-preview")}
              alt="Vista previa del curso"
              className="admin-product-preview"
              width={1200}
              height={900}
              unoptimized
              sizes={ADMIN_PREVIEW_IMAGE_SIZES}
            />
          ) : null}

          <label>
            <input
              type="checkbox"
              checked={courseForm.isActive}
              onChange={(event) => setCourseForm((current) => ({ ...current, isActive: event.target.checked }))}
            />{" "}
            Curso activo
          </label>

          <div className="cta-row">
            <button type="submit" className="btn btn-primary" disabled={isUploadingImage}>
              {editingCourseId ? "Guardar cambios" : "Crear curso"}
            </button>
            {editingCourseId ? (
              <button type="button" className="btn btn-ghost" onClick={resetCourseForm}>
                Cancelar edición
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="studio-card">
        <p className="card-label">Listado</p>
        <h2>Cursos registrados</h2>

        {loading ? <p>Cargando cursos...</p> : null}

        {!loading && !sortedCourses.length ? <p>No hay cursos todavía.</p> : null}

        <div className="admin-product-list">
          {sortedCourses.map((course) => (
            <article key={course.id} className="studio-card">
              <p className="card-label">{course.slug}</p>
              <h3>{course.title}</h3>
              <p>Precio: ${course.price.toLocaleString("es-MX")}</p>
              <p>Estatus: {course.isActive ? "Activo" : "Inactivo"}</p>
              <p>Sesiones: {course.sessions.length}</p>

              <div className="cta-row">
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedCourseId(course.id)}>
                  Gestionar sesiones
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => startCourseEdit(course)}>
                  Editar
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => void deleteCourse(course.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-card">
        <p className="card-label">Sesiones</p>
        <h2>{selectedCourse ? `Sesiones de ${selectedCourse.title}` : "Selecciona un curso"}</h2>

        {selectedCourse ? (
          <>
            <form
              className="studio-form admin-product-form"
              onSubmit={(event) => void handleSessionSubmit(event, selectedCourse.id)}
            >
              <label>
                Inicio
                <input
                  required
                  type="datetime-local"
                  value={sessionForms[selectedCourse.id]?.startsAt ?? ""}
                  onChange={(event) =>
                    setSessionForms((current) => ({
                      ...current,
                      [selectedCourse.id]: {
                        ...(current[selectedCourse.id] ?? initialSessionForm),
                        startsAt: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label>
                Término (opcional)
                <input
                  type="datetime-local"
                  value={sessionForms[selectedCourse.id]?.endsAt ?? ""}
                  onChange={(event) =>
                    setSessionForms((current) => ({
                      ...current,
                      [selectedCourse.id]: {
                        ...(current[selectedCourse.id] ?? initialSessionForm),
                        endsAt: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label>
                Cupo
                <input
                  required
                  type="number"
                  min="1"
                  value={sessionForms[selectedCourse.id]?.capacity ?? ""}
                  onChange={(event) =>
                    setSessionForms((current) => ({
                      ...current,
                      [selectedCourse.id]: {
                        ...(current[selectedCourse.id] ?? initialSessionForm),
                        capacity: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={sessionForms[selectedCourse.id]?.isActive ?? true}
                  onChange={(event) =>
                    setSessionForms((current) => ({
                      ...current,
                      [selectedCourse.id]: {
                        ...(current[selectedCourse.id] ?? initialSessionForm),
                        isActive: event.target.checked,
                      },
                    }))
                  }
                />{" "}
                Sesión activa
              </label>

              <div className="cta-row">
                <button type="submit" className="btn btn-primary">
                  {editingSessionId ? "Guardar sesión" : "Crear sesión"}
                </button>
                {editingSessionId ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => resetSessionForm(selectedCourse.id)}
                  >
                    Cancelar edición
                  </button>
                ) : null}
              </div>
            </form>

            <div className="admin-product-list">
              {selectedCourse.sessions.map((session) => (
                <article key={session.id} className="studio-card">
                  <h3>{new Date(session.startsAt).toLocaleString("es-MX")}</h3>
                  <p>
                    Fin: {session.endsAt ? new Date(session.endsAt).toLocaleString("es-MX") : "No definido"}
                  </p>
                  <p>
                    Cupo: {session.capacity} · Reservados: {session.reservedSpots}
                  </p>
                  <p>Estatus: {session.isActive ? "Activa" : "Inactiva"}</p>

                  <div className="cta-row">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => startSessionEdit(selectedCourse.id, session)}
                    >
                      Editar sesión
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void deleteSession(selectedCourse.id, session.id)}
                    >
                      Eliminar sesión
                    </button>
                  </div>
                </article>
              ))}

              {!selectedCourse.sessions.length ? <p>No hay sesiones para este curso.</p> : null}
            </div>
          </>
        ) : (
          <p>Elige un curso para administrar sus fechas y cupos.</p>
        )}
      </section>

      {feedback ? <p>{feedback}</p> : null}
    </div>
  );
}
