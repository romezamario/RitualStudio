import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";

type EditorialSection = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

type EditorialPick = {
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1800&q=86";

const editorialSections: EditorialSection[] = [
  {
    eyebrow: "Curated Marketplace",
    title: "Curated Marketplace",
    description:
      "Shop ready-to-send floral pieces, premium objects and gifting gestures selected with the studio's seasonal eye.",
    href: "/marketplace",
    cta: "Explore the marketplace"
  },
  {
    eyebrow: "Experiences",
    title: "Experiences",
    description:
      "Join floral workshops and intimate learning formats designed for guests who want to create with intention.",
    href: "/cursos",
    cta: "View experiences"
  },
  {
    eyebrow: "Design by Brief",
    title: "Design by Brief",
    description:
      "Share a palette, message, budget or occasion and let the studio translate it into a tailored floral composition.",
    href: "/custom",
    cta: "Start a custom brief"
  },
  {
    eyebrow: "Events & Spaces",
    title: "Events & Spaces",
    description:
      "Floral direction for celebrations, dinners, launches and interiors that need atmosphere, rhythm and detail.",
    href: "/eventos",
    cta: "Plan an event"
  }
];

const editorialPicks: EditorialPick[] = [
  {
    label: "Marketplace",
    title: "Seasonal stems and ready rituals",
    description: "Pieces selected for fast decisions without losing an editorial point of view.",
    href: "/marketplace",
    cta: "Shop the edit"
  },
  {
    label: "Experiences",
    title: "Workshops with a studio pace",
    description: "Hands-on floral sessions for personal rituals, creative teams and intimate groups.",
    href: "/cursos",
    cta: "See dates"
  },
  {
    label: "Brief",
    title: "A composition shaped around the moment",
    description: "A bespoke path when the occasion needs a specific gesture, tone or spatial language.",
    href: "/custom",
    cta: "Send a brief"
  }
];

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  return (
    <SiteShell
      eyebrow="Ritual Studio"
      title="Flores premium para regalar, celebrar y transformar espacios"
      subtitle="Compra online con entrega confiable o solicita un diseño floral personalizado para momentos memorables."
    >
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-media" aria-hidden="true">
          <Image
            src={HERO_IMAGE_URL}
            alt=""
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1100px"
            className="home-hero-image"
          />
        </div>
        <div className="home-hero-content">
          <p className="home-hero-kicker">Ritual Studio</p>
          <h2 id="home-hero-title">Floral experiences, curated objects & moments.</h2>
          <div className="home-hero-cta" aria-label="Acciones principales">
            <Link href="/marketplace" className="home-hero-button home-hero-button-primary">
              Explorar colección
            </Link>
            <Link href="/custom" className="home-hero-button home-hero-button-secondary">
              Diseño a medida
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="the-studio-title">
        <div className="section-intro">
          <p className="section-tag">The Studio</p>
          <p className="section-microcopy">A floral studio for gestures, gatherings and spaces.</p>
        </div>
        <article className="studio-card">
          <p className="card-label">The Studio</p>
          <h2 id="the-studio-title">The Studio</h2>
          <p>
            Ritual Studio creates premium floral rituals for gifting, learning, events and atmosphere. Each path begins
            with an editorial point of view and ends with a considered gesture for the moment.
          </p>
          <Link href="/contacto" className="text-link">
            Contact the studio
          </Link>
        </article>
      </section>

      {editorialSections.map((section) => (
        <section
          key={section.title}
          className="section-block"
          aria-labelledby={`${section.href.slice(1)}-title`}
        >
          <div className="section-intro">
            <p className="section-tag">{section.eyebrow}</p>
            <p className="section-microcopy">Ritual Studio · {section.title}</p>
          </div>
          <article className="studio-card">
            <p className="card-label">{section.eyebrow}</p>
            <h2 id={`${section.href.slice(1)}-title`}>{section.title}</h2>
            <p>{section.description}</p>
            <Link href={section.href} className="text-link">
              {section.cta}
            </Link>
          </article>
        </section>
      ))}

      <section className="section-block" aria-labelledby="editorial-selection-title">
        <div className="section-intro">
          <p className="section-tag">Editorial Selection</p>
          <p className="section-microcopy">Three ways to begin, curated by the studio.</p>
        </div>
        <h2 id="editorial-selection-title">Editorial Selection</h2>
        <div className="feature-grid">
          {editorialPicks.map((item) => (
            <article key={item.title} className="studio-card">
              <p className="card-label">{item.label}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link href={item.href} className="text-link">
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-card contact-highlight" aria-labelledby="final-cta-title">
        <p className="card-label">Final CTA</p>
        <h2 id="final-cta-title">Tell us the moment. We’ll design the ritual.</h2>
        <p>
          Share the occasion, date, location and feeling you want to create. We will guide the next step with a clear,
          considered floral proposal.
        </p>
        <div className="cta-row" style={{ marginTop: "0.35rem" }}>
          <Link href="/contacto" className="btn btn-primary">
            Contact Ritual Studio
          </Link>
          <Link href="/eventos" className="btn btn-ghost">
            Explore events & spaces
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
