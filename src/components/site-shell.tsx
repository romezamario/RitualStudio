"use client";

import Link from "next/link";
import { useState } from "react";
import { CartProvider, useCart } from "@/components/cart-context";
import { getWhatsAppHref } from "@/lib/whatsapp";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/arreglos", label: "Arreglos" },
  { href: "/custom", label: "Diseño a medida" },
  { href: "/eventos", label: "Eventos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
  { href: "/aviso-de-privacidad", label: "Aviso de privacidad" },
  { href: "/login", label: "Login" }
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
  const { totalItems } = useCart();

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

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
    </main>
  );
}

export default function SiteShell({ title, subtitle, eyebrow, children }: SiteShellProps) {
  return (
    <CartProvider>
      <SiteShellFrame title={title} subtitle={subtitle} eyebrow={eyebrow}>
        {children}
      </SiteShellFrame>
    </CartProvider>
  );
}
