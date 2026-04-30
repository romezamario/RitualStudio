import Link from "next/link";
import { HeaderInteractive } from "@/components/header-interactive";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { getWhatsAppHref } from "@/lib/whatsapp";
import packageJson from "../../package.json";

const links = [
  { href: "/marketplace", label: "Tienda" },
  { href: "/cursos", label: "Cursos" },
  { href: "/custom", label: "Diseño a medida" },
  { href: "/eventos", label: "Eventos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

const whatsappHref = getWhatsAppHref(process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ?? "Hola Ritual Studio, quiero más información.");
const siteVersion = process.env.NEXT_PUBLIC_SITE_VERSION?.trim() || packageJson.version;

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
        <div className="text-container">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {subtitle ? <p className="lead">{subtitle}</p> : null}
        </div>
        {children}
      </section>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <p>
            © {new Date().getFullYear()} Ritual Studio · v{siteVersion}
          </p>
          <Link href="/aviso-de-privacidad">Aviso de privacidad</Link>
        </div>
      </footer>

      <FloatingWhatsAppButton href={whatsappHref} />
    </main>
  );
}
