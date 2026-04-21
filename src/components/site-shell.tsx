"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/components/auth-context";
import { CartProvider, useCart } from "@/components/cart-context";
import { getWhatsAppHref } from "@/lib/whatsapp";

const links = [
  { href: "/", label: "Inicio" },
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
  const userDisplayName = user?.fullName ?? user?.username ?? user?.email;
  const userInitials = getUserInitials(userDisplayName);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const userMenuLinks =
    user?.role === "admin"
      ? [
          { href: "/mi-cuenta/pedidos", label: "Mis pedidos" },
          { href: "/mi-cuenta/direcciones", label: "Mis direcciones" },
          { href: "/admin/pedidos", label: "Gestión de pedidos" },
          { href: "/admin/usuarios", label: "Gestión de usuarios" },
        ]
      : [
          { href: "/mi-cuenta/pedidos", label: "Mis pedidos" },
          { href: "/mi-cuenta/direcciones", label: "Mis direcciones" },
        ];

  return (
    <main className="site-root">
      <div className="ambient-orb ambient-orb-left" aria-hidden />
      <div className="ambient-orb ambient-orb-right" aria-hidden />

      <header className="site-header">
        <div className="container nav-wrap">
          <Link href="/" className="brand" aria-label="Ritual Studio inicio" onClick={closeMenu}>
            <span className="brand-main">Ritual Studio</span>
            <span className="brand-sub">by Sol</span>
          </Link>

          <div className="header-right">
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
                        onClick={() => {
                          signOut();
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
            <Link href="/carrito" onClick={closeMenu} className="cart-link">
              Ver carrito{totalItems > 0 ? ` (${totalItems})` : ""}
            </Link>
          </nav>

          <div className={`header-actions ${isMenuOpen ? "is-open" : ""}`}>
            <span className="palette-swatch" aria-hidden>
              <i className="swatch swatch-1" />
              <i className="swatch swatch-2" />
              <i className="swatch swatch-3" />
              <i className="swatch swatch-4" />
            </span>
            <Link href="/carrito" className="btn btn-ghost" onClick={closeMenu}>
              Ver carrito{totalItems > 0 ? ` (${totalItems})` : ""}
            </Link>
            <a
              href={whatsappHref}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              Contáctanos
            </a>
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

export default function SiteShell({ title, subtitle, eyebrow, children }: SiteShellProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <SiteShellFrame title={title} subtitle={subtitle} eyebrow={eyebrow}>
          {children}
        </SiteShellFrame>
      </CartProvider>
    </AuthProvider>
  );
}
