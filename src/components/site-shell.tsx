import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/arreglos", label: "Arreglos" },
  { href: "/custom", label: "Diseño a medida" },
  { href: "/eventos", label: "Eventos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" }
];

type SiteShellProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
};

export default function SiteShell({ title, subtitle, eyebrow, children }: SiteShellProps) {
  return (
    <main className="site-root">
      <div className="ambient-orb ambient-orb-left" aria-hidden />
      <div className="ambient-orb ambient-orb-right" aria-hidden />

      <header className="site-header">
        <div className="container nav-wrap">
          <Link href="/" className="brand" aria-label="Ritual Studio inicio">
            Ritual Studio
          </Link>
          <nav className="nav-links" aria-label="Navegación principal">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href="/custom" className="btn btn-ghost">
            Reservar asesoría
          </Link>
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
