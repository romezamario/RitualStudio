"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/arreglos", label: "Arreglos" },
  { href: "/custom", label: "Diseño a medida" },
  { href: "/eventos", label: "Eventos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" }
];

const DEFAULT_WHATSAPP_NUMBER = "5520904940";
const rawWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? DEFAULT_WHATSAPP_NUMBER;

function toWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `52${digits}`;
  }

  return digits;
}

const whatsappNumber = toWhatsAppNumber(rawWhatsAppNumber);
const whatsappMessage = encodeURIComponent(
  process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ?? "Hola Ritual Studio, quiero más información."
);
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

type SiteShellProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
};

export default function SiteShell({ title, subtitle, eyebrow, children }: SiteShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          </nav>

          <div className={`header-actions ${isMenuOpen ? "is-open" : ""}`}>
            <span className="palette-swatch" aria-hidden>
              <i className="swatch swatch-1" />
              <i className="swatch swatch-2" />
              <i className="swatch swatch-3" />
              <i className="swatch swatch-4" />
            </span>
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
