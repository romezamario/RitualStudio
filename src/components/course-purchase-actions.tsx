"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
import type { CourseCatalogCourse, CourseCatalogSession } from "@/lib/courses-catalog";

type CoursePurchaseActionsProps = {
  course: CourseCatalogCourse;
  initialSessions: CourseCatalogSession[];
};

type SessionsApiResponse = {
  data?: {
    sessions?: CourseCatalogSession[];
  };
};

const MAX_PARTICIPANTS = 6;

function formatCurrency(value: number) {
  return `$${new Intl.NumberFormat("es-MX").format(value)} MXN`;
}

function formatSessionLabel(session: CourseCatalogSession) {
  return new Date(session.startsAt).toLocaleString("es-MX", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function formatSessionButtonLabel(startsAt: string) {
  return new Date(startsAt).toLocaleString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CoursePurchaseActions({ course, initialSessions }: CoursePurchaseActionsProps) {
  const router = useRouter();
  const { addCourseToCart } = useCart();
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessions[0]?.id ?? "");
  const [participants, setParticipants] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  const remainingSpotsBySession = useMemo(() => {
    return new Map(sessions.map((session) => [session.id, Math.max(session.capacity - session.reservedSpots, 0)]));
  }, [sessions]);

  const refreshSessions = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/courses/${course.slug}/sessions`, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as SessionsApiResponse | null;

      if (!response.ok || !body?.data?.sessions) {
        throw new Error("No fue posible actualizar los cupos en este momento.");
      }

      setSessions(body.data.sessions);
      return body.data.sessions;
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible actualizar los cupos.");
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  const addSelectedCourseToCart = async () => {
    const latestSessions = await refreshSessions();
    const sourceSessions = latestSessions ?? sessions;

    const currentSession = sourceSessions.find((session) => session.id === selectedSessionId);

    if (!currentSession) {
      setFeedback("Selecciona una sesión disponible antes de continuar.");
      return;
    }

    const remainingSpots = Math.max(currentSession.capacity - currentSession.reservedSpots, 0);

    if (remainingSpots < participants) {
      setFeedback(`Solo quedan ${remainingSpots} lugares disponibles para esta sesión.`);
      return;
    }

    addCourseToCart({
      slug: course.slug,
      courseId: course.id,
      courseSessionId: currentSession.id,
      sessionStartsAt: currentSession.startsAt,
      name: course.title,
      unitPrice: formatCurrency(course.price),
      image: course.imageUrl || "/images/logo.png",
      participants,
    });

    setFeedback("Curso agregado al carrito");
    window.setTimeout(() => setFeedback(""), 1800);
    return true;
  };

  const handleAddCourseToCart = async () => {
    await addSelectedCourseToCart();
  };

  const handleBuyNow = async () => {
    const wasAdded = await addSelectedCourseToCart();
    if (wasAdded) {
      router.push("/checkout");
    }
  };

  return (
    <>
      <section className="studio-card">
        <p className="card-label">Sesiones disponibles</p>
        {sessions.length > 0 ? (
          <div className="stack-sm">
            <div className="cta-row">
              {sessions.map((session) => {
                const remainingSpots = remainingSpotsBySession.get(session.id) ?? 0;
                const isSelected = selectedSessionId === session.id;
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`btn ${isSelected ? "btn-primary" : "btn-ghost"}`}
                    disabled={remainingSpots <= 0}
                    aria-pressed={isSelected}
                  >
                    {formatSessionButtonLabel(session.startsAt)}
                  </button>
                );
              })}
            </div>
            {selectedSession ? (
              <p>
                Disponibilidad actual: <strong>{remainingSpotsBySession.get(selectedSession.id) ?? 0} lugares</strong>
              </p>
            ) : null}
          </div>
        ) : (
          <p>Sin cupo disponible por ahora.</p>
        )}
      </section>

      <section id="course-booking" className="studio-card">
        <p className="card-label">Reserva tu lugar</p>
        <div className="stack-sm">

          <div className="course-participants-stepper" aria-label="Selector de participantes">
          <p className="course-participants-title">Participantes</p>
          <div className="course-stepper-control">
            <button
              type="button"
              className="course-stepper-button"
              onClick={() => setParticipants((current) => Math.max(current - 1, 1))}
              disabled={participants <= 1}
              aria-label="Disminuir participantes"
            >
              −
            </button>
            <span className="course-stepper-value" aria-live="polite">
              {participants}
            </span>
            <button
              type="button"
              className="course-stepper-button"
              onClick={() => setParticipants((current) => Math.min(current + 1, MAX_PARTICIPANTS))}
              disabled={participants >= MAX_PARTICIPANTS}
              aria-label="Aumentar participantes"
            >
              +
            </button>
          </div>
          <p className="small-muted">Máximo {MAX_PARTICIPANTS} participantes por reserva.</p>
          </div>

          {selectedSession ? (
            <p>
              Fecha seleccionada: <strong>{formatSessionLabel(selectedSession)}</strong>
            </p>
          ) : null}

          <p className="small-muted">
            Cupo mostrado en tiempo real (snapshot). La disponibilidad final se valida en backend al pagar.
          </p>

          <div className="cta-row">
            <button type="button" className="btn btn-ghost" onClick={() => void refreshSessions()} disabled={isRefreshing}>
              {isRefreshing ? "Actualizando..." : "Actualizar cupo"}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleAddCourseToCart()} disabled={!selectedSession}>
              Agregar curso al carrito
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleBuyNow()} disabled={!selectedSession}>
              Comprar ahora
            </button>
          </div>

          {feedback ? <p className="cart-feedback">{feedback}</p> : null}
        </div>
      </section>
    </>
  );
}
