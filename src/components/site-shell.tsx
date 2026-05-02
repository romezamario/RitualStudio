import Link from "next/link";
import { HeaderInteractive } from "@/components/header-interactive";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { getWhatsAppHref } from "@/lib/whatsapp";
import packageJson from "../../package.json";

const links = [
  { href: "/marketplace", label: "Tienda" },
  { href: "/cursos", label: "Experiencias" },
  { href: "/custom", label: "Diseño a medida" },
  { href: "/eventos", label: "Eventos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

const whatsappHref = getWhatsAppHref(process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ?? "Hola Ritual Studio, quiero más información.");
const siteVersion = process.env.NEXT_PUBLIC_SITE_VERSION?.trim() || packageJson.version;
const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || "https://www.instagram.com/ritualstudiomx?igsh=aTFiZmFjbnAxODkz";

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
        <HeaderInteractive links={links} />
      </header>

      <section className="container hero-block">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="lead">{subtitle}</p> : null}
        {children}
      </section>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <p>
            © {new Date().getFullYear()} Ritual Studio · v{siteVersion}
          </p>
          <div className="site-footer-links">
            <Link href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram de Ritual Studio" className="site-footer-social-link">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="site-footer-social-icon"
              >
                <rect x="3.5" y="3.5" width="17" height="17" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
              </svg>
            </Link>
            <Link href="/aviso-de-privacidad">Aviso de privacidad</Link>
          </div>
        </div>
      </footer>

      <FloatingWhatsAppButton href={whatsappHref} />
    </main>
  );
}
