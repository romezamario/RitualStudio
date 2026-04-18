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
  children?: React.ReactNode;
};

export default function SiteShell({ title, subtitle, children }: SiteShellProps) {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-serif text-xl">Ritual Studio</span>
          <nav className="hidden gap-5 text-sm md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-neutral-300 transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <h1 className="font-serif text-4xl md:text-6xl">{title}</h1>
        {subtitle ? <p className="mt-4 max-w-2xl text-neutral-300">{subtitle}</p> : null}
        {children}
      </section>
    </main>
  );
}
