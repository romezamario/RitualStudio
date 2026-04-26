"use client";

import { useEffect, useRef, useState } from "react";

type FloatingWhatsAppButtonProps = {
  href: string;
};

export function FloatingWhatsAppButton({ href }: FloatingWhatsAppButtonProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragPointerId = useRef<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const movedDuringDrag = useRef(false);

  useEffect(() => {
    const setDefaultPosition = () => {
      const buttonSize = 56;
      const margin = 16;
      setPosition({
        x: window.innerWidth - buttonSize - margin,
        y: window.innerHeight - buttonSize - margin,
      });
    };

    setDefaultPosition();
    window.addEventListener("resize", setDefaultPosition);

    return () => window.removeEventListener("resize", setDefaultPosition);
  }, []);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  if (!position) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-floating"
      aria-label="Contactar por WhatsApp"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onPointerDown={(event) => {
        dragPointerId.current = event.pointerId;
        movedDuringDrag.current = false;
        dragOffset.current = {
          x: event.clientX - position.x,
          y: event.clientY - position.y,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (dragPointerId.current !== event.pointerId) {
          return;
        }

        const buttonSize = 56;
        const margin = 8;
        const nextX = clamp(event.clientX - dragOffset.current.x, margin, window.innerWidth - buttonSize - margin);
        const nextY = clamp(event.clientY - dragOffset.current.y, margin, window.innerHeight - buttonSize - margin);

        if (Math.abs(nextX - position.x) > 2 || Math.abs(nextY - position.y) > 2) {
          movedDuringDrag.current = true;
        }

        setPosition({ x: nextX, y: nextY });
      }}
      onPointerUp={(event) => {
        if (dragPointerId.current === event.pointerId) {
          dragPointerId.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onClick={(event) => {
        if (movedDuringDrag.current) {
          event.preventDefault();
          movedDuringDrag.current = false;
        }
      }}
    >
      <WhatsAppIcon />
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="whatsapp-icon" aria-hidden>
      <path
        d="M12 3.5c-4.97 0-9 3.81-9 8.5 0 2.55 1.2 4.83 3.09 6.38L5 21l2.96-1.55c1.19.52 2.52.8 3.94.8 4.97 0 9-3.81 9-8.5s-4.03-8.25-8.9-8.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.15 9.05c.24-.28.49-.34.73-.34.17 0 .35.01.51.01.16 0 .41-.06.62.45.24.57.82 1.95.89 2.09.07.14.12.31.02.5-.1.19-.15.3-.3.46-.15.16-.31.35-.44.46-.15.14-.31.29-.13.57.18.28.8 1.29 1.71 2.09 1.17 1.02 2.16 1.34 2.47 1.49.31.15.49.13.67-.08.18-.21.77-.9.98-1.21.2-.31.41-.25.7-.15.28.1 1.8.83 2.11.98.31.16.52.23.6.35.08.12.08.73-.17 1.43-.25.7-1.49 1.39-2.04 1.46-.52.07-1.2.1-3.87-.96-3.1-1.22-5.1-4.2-5.26-4.41-.15-.21-1.27-1.67-1.27-3.19 0-1.52.78-2.26 1.08-2.6Z"
        fill="currentColor"
      />
    </svg>
  );
}
