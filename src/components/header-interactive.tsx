"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useCart } from "@/components/cart-context";

type HeaderLink = {
  href: string;
  label: string;
};

type HeaderInteractiveProps = {
  links: HeaderLink[];
};

export function HeaderInteractive({ links }: HeaderInteractiveProps) {
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
          { href: "/admin/productos", label: "Gestión de productos" },
        ]
      : [
          { href: "/mi-cuenta", label: "Dashboard" },
          { href: "/mi-cuenta/pedidos", label: "Mis pedidos" },
          { href: "/mi-cuenta/direcciones", label: "Mis direcciones" },
        ];

  return (
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

      <nav id="site-navigation" className={`nav-links ${isMenuOpen ? "is-open" : ""}`} aria-label="Navegación principal">
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
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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
