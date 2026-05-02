"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toRenderableProductImageUrl } from "@/lib/product-image-storage";
import { MAX_UPLOAD_IMAGE_BYTES, processImageBeforeUpload } from "@/lib/client-image-processing";

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice?: number;
  hasOffer: boolean;
  isActive: boolean;
  imageUrl: string | null;
  sessions: { id: string }[];
};

type CourseFormState = {
  slug: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  hasOffer: boolean;
  offerPrice: string;
  isActive: boolean;
};

const initialCourseForm: CourseFormState = {
  slug: "",
  title: "",
  description: "",
  price: "",
  imageUrl: "",
  hasOffer: false,
  offerPrice: "",
  isActive: true,
};

const ADMIN_PREVIEW_IMAGE_SIZES = "(max-width: 900px) 100vw, 50vw";

export default function AdminCoursesManager() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [courseForm, setCourseForm] = useState<CourseFormState>(initialCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
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
          setCourses(body?.data ?? []);
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
  }, []);

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.title.localeCompare(b.title, "es-MX")),
    [courses],
  );

  const resetCourseForm = () => {
    setCourseForm(initialCourseForm);
    setEditingCourseId(null);
  };

  const handleCourseSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUploadingImage) {
      setFeedback("Espera a que termine la subida de imagen.");
      return;
    }

    const parsedPrice = Number(courseForm.price);
    const offerPrice = Number(courseForm.offerPrice);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFeedback("Ingresa un precio válido mayor a 0.");
      return;
    }

    if (courseForm.hasOffer && (!Number.isFinite(offerPrice) || offerPrice <= 0 || offerPrice >= parsedPrice)) {
      setFeedback("Si activas oferta, ingresa un precio de oferta válido y menor al precio base.");
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
          hasOffer: courseForm.hasOffer,
          offerPrice: courseForm.hasOffer ? offerPrice : undefined,
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
      hasOffer: Boolean(course.hasOffer),
      offerPrice: course.hasOffer ? String(course.price) : "",
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

      if (editingCourseId === courseId) {
        resetCourseForm();
      }

      setFeedback("Curso eliminado correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible eliminar el curso.");
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
            Precio base (MXN)
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
            <input
              type="checkbox"
              checked={courseForm.hasOffer}
              onChange={(event) => setCourseForm((current) => ({ ...current, hasOffer: event.target.checked }))}
            />{" "}
            Activar oferta
          </label>

          {courseForm.hasOffer ? (
            <label>
              Precio de oferta (MXN)
              <input
                required
                type="number"
                min="1"
                step="1"
                value={courseForm.offerPrice}
                onChange={(event) => setCourseForm((current) => ({ ...current, offerPrice: event.target.value }))}
              />
            </label>
          ) : null}

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
              <p>Precio: ${course.price.toLocaleString("es-MX")}{course.hasOffer && course.originalPrice ? ` (antes $${course.originalPrice.toLocaleString("es-MX")})` : ""}</p>
              <p>Estatus: {course.isActive ? "Activo" : "Inactivo"}</p>
              <p>Sesiones: {course.sessions.length}</p>

              <div className="cta-row">
                <Link href={`/admin/cursos/${course.id}/sesiones`} className="btn btn-ghost">
                  Gestionar sesiones
                </Link>
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

      {feedback ? <p>{feedback}</p> : null}
    </div>
  );
}
