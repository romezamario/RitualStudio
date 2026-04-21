"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useCart } from "@/components/cart-context";
import { getWhatsAppHref } from "@/lib/whatsapp";

const links = [
  { href: "/marketplace", label: "Tienda" },
  { href: "/custom", label: "Diseño a medida" },
  { href: "/eventos", label: "Eventos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" }
];

const whatsappHref = getWhatsAppHref(process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ?? "Hola Ritual Studio, quiero más información.");

type SiteShellProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
};

function SiteShellFrame({ title, subtitle, eyebrow, children }: SiteShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { isAuthenticated, user, signOut } = useAuth();
  const userDisplayName = user?.email;
  const userInitials = getUserInitials(userDisplayName);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const userMenuLinks =
    user?.role === "admin"
      ? [
          { href: "/mi-cuenta", label: "Dashboard" },
          { href: "/mi-cuenta/pedidos", label: "Mis pedidos" },
          { href: "/mi-cuenta/direcciones", label: "Mis direcciones" },
          { href: "/admin/pedidos", label: "Gestión de pedidos" },
          { href: "/admin/usuarios", label: "Gestión de usuarios" },
        ]
      : [
          { href: "/mi-cuenta", label: "Dashboard" },
          { href: "/mi-cuenta/pedidos", label: "Mis pedidos" },
          { href: "/mi-cuenta/direcciones", label: "Mis direcciones" },
        ];

  return (
    <main className="site-root">
      <div className="ambient-orb ambient-orb-left" aria-hidden />
      <div className="ambient-orb ambient-orb-right" aria-hidden />

      <header className="site-header">
        <div className="container nav-wrap">
          <div className="header-primary-row">
            <Link href="/" className="brand" aria-label="Ritual Studio inicio" onClick={closeMenu}>
              <span className="brand-main">Ritual Studio</span>
              <span className="brand-sub">by Sol</span>
            </Link>

            <button
              type="button"
              className={`menu-toggle ${isMenuOpen ? "is-open" : ""}`}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMenuOpen}
              aria-controls="site-navigation"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <span aria-hidden />
              <span aria-hidden />
              <span aria-hidden />
            </button>
          </div>

          <nav
            id="site-navigation"
            className={`nav-links ${isMenuOpen ? "is-open" : ""}`}
            aria-label="Navegación principal"
          >
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-secondary-row">
            <Link
              href="/carrito"
              className="cart-access"
              aria-label={totalItems > 0 ? `Ver carrito con ${totalItems} productos` : "Ver carrito"}
              onClick={closeMenu}
            >
              <CartIcon />
              <span className="sr-only">Ver carrito</span>
              {totalItems > 0 ? (
                <span className="cart-access-badge" aria-label={`${totalItems} productos en el carrito`}>
                  {totalItems}
                </span>
              ) : null}
            </Link>

            <div className="user-menu account-access">
              <button
                type="button"
                className={`user-access-trigger ${isAuthenticated ? "is-authenticated" : ""}`}
                aria-label={
                  isAuthenticated
                    ? `Cuenta de ${userDisplayName}. Abrir menú de usuario`
                    : "Abrir opciones de iniciar sesión o crear usuario"
                }
                aria-expanded={isUserMenuOpen}
                aria-controls="user-menu-panel"
                onClick={() => setIsUserMenuOpen((current) => !current)}
              >
                {isAuthenticated ? (
                  <span className="user-initials" aria-hidden>
                    {userInitials}
                  </span>
                ) : (
                  <>
                    <UserIcon />
                    <span className="sr-only">Cuenta</span>
                  </>
                )}
              </button>
              {isUserMenuOpen ? (
                <div id="user-menu-panel" className="user-menu-panel">
                  {isAuthenticated ? (
                    <>
                      <p className="user-menu-role">Rol: {user?.role === "admin" ? "Administrador" : "Usuario"}</p>
                      {userMenuLinks.map((menuLink) => (
                        <Link key={menuLink.href} href={menuLink.href} onClick={closeMenu} className="user-menu-link">
                          {menuLink.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        className="user-menu-logout"
                        onClick={async () => {
                          await signOut();
                          closeMenu();
                        }}
                      >
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={closeMenu} className="user-menu-link">
                        Iniciar sesión
                      </Link>
                      <Link href="/login?mode=signup" onClick={closeMenu} className="user-menu-link">
                        Crear usuario
                      </Link>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section className="container hero-block">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="lead">{subtitle}</p> : null}
        {children}
      </section>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <p>© {new Date().getFullYear()} Ritual Studio.</p>
          <Link href="/aviso-de-privacidad">Aviso de privacidad</Link>
        </div>
      </footer>

      <DraggableWhatsAppButton />
    </main>
  );
}

function getUserInitials(name?: string) {
  if (!name) {
    return "RS";
  }

  const cleaned = name.trim();

  if (!cleaned) {
    return "RS";
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");

  return initials || cleaned.slice(0, 2).toUpperCase();
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="user-icon" aria-hidden>
      <path
        d="M12 12.75a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Zm0 2.25c-4.83 0-8.75 2.69-8.75 6v.75h17.5V21c0-3.31-3.92-6-8.75-6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="cart-icon" aria-hidden>
      <path
        d="M3 4.25h1.67c.33 0 .62.23.69.55l.33 1.45h12.55a.75.75 0 0 1 .72.96l-1.34 4.7a2.75 2.75 0 0 1-2.64 1.99H9.31a2.75 2.75 0 0 1-2.67-2.09L5.22 5.74h-2.2a.75.75 0 0 1 0-1.5Zm4.89 7.23c.16.66.74 1.12 1.42 1.12h6.67c.68 0 1.27-.46 1.43-1.12l1.06-3.73H6.83l1.06 3.73ZM8.75 17.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Zm7.5 0a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="whatsapp-icon" aria-hidden>
      <path
        d="M12.03 3.25a8.75 8.75 0 0 0-7.48 13.29L3 21l4.65-1.5a8.75 8.75 0 1 0 4.38-16.25Zm0 1.5a7.25 7.25 0 0 1 6.17 11.04 7.2 7.2 0 0 1-6.17 3.46c-1.27 0-2.52-.34-3.61-.98l-.27-.16-2.73.88.9-2.62-.17-.27a7.25 7.25 0 0 1 5.88-11.35Zm-3.11 3.78c-.2 0-.51.08-.77.37-.26.29-.98.95-.98 2.3s1 2.65 1.14 2.84c.14.19 1.97 3.17 4.88 4.31 2.42.95 2.92.76 3.45.71.53-.05 1.71-.7 1.95-1.39.24-.69.24-1.28.17-1.39-.07-.12-.26-.19-.54-.33-.28-.14-1.66-.82-1.92-.91-.26-.09-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.16.19-.33.21-.61.07-.28-.14-1.2-.44-2.29-1.41-.85-.76-1.42-1.7-1.59-1.98-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.47-.64-.48h-.55Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DraggableWhatsAppButton() {
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
      href={whatsappHref}
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

export default function SiteShell({ title, subtitle, eyebrow, children }: SiteShellProps) {
  return (
    <SiteShellFrame title={title} subtitle={subtitle} eyebrow={eyebrow}>
      {children}
    </SiteShellFrame>
  );
}
