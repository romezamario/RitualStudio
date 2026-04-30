import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/components/site-shell";

const CARD_IMAGE_SIZES = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw";
const HERO_IMAGE_SIZES = "(max-width: 1024px) 100vw, 50vw";

const featuredSections = [
  {
    title: "Tienda",
    description: "Bouquets de temporada listos para entregar con sello Ritual.",
    href: "/marketplace",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Cursos",
    description: "Workshops presenciales para dominar técnica y composición.",
    href: "/cursos",
    image:
      "https://images.unsplash.com/photo-1455659817273-f96807779a8a?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Diseño personalizado",
    description: "Dirección creativa floral para espacios, marcas y regalos.",
    href: "/custom",
    image:
      "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Eventos",
    description: "Ambientaciones sensoriales para bodas, cenas y hospitalidad.",
    href: "/eventos",
    image:
      "https://images.unsplash.com/photo-1478144592103-25e218a04891?auto=format&fit=crop&w=1200&q=80"
  }
] as const;

const sliderSlides = [
  {
    title: "Colección de autor",
    description: "Piezas botánicas de edición limitada para momentos memorables.",
    href: "/marketplace",
    image:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Experiencias en estudio",
    description: "Sesiones guiadas para aprender diseño floral con enfoque editorial.",
    href: "/cursos",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Rituales para marcas",
    description: "Instalaciones florales que elevan lanzamientos y activaciones.",
    href: "/custom",
    image:
      "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=1200&q=80"
  }
] as const;

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  return (
    <SiteShell eyebrow="Estudio floral editorial" title="Ritual Studio" subtitle="Diseño floral con sensibilidad contemporánea para celebrar, regalar y habitar.">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-12 md:px-6 lg:px-8">
        <section className="w-full overflow-hidden rounded-3xl bg-stone-100" aria-label="Hero principal">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-5 p-8 md:p-10 lg:p-12">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Dirección floral premium</p>
              <h1 className="text-3xl font-semibold leading-tight text-stone-900 md:text-4xl">Flores con narrativa para rituales cotidianos y grandes ocasiones.</h1>
              <p className="max-w-xl text-sm text-stone-600 md:text-base">Creamos composiciones editoriales que combinan técnica botánica, textura y emoción.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/marketplace" className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700">Comprar colección</Link>
                <Link href="/contacto" className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-500">Agendar asesoría</Link>
              </div>
            </div>
            <div className="relative min-h-[320px]">
              <Image src="https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1600&q=80" alt="Composición floral editorial" fill sizes={HERO_IMAGE_SIZES} className="object-cover" priority />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl text-center" aria-labelledby="home-headline">
          <h2 id="home-headline" className="text-2xl font-semibold text-stone-900 md:text-3xl">Un estudio para crear experiencias florales con identidad.</h2>
          <p className="mt-3 text-sm text-stone-600 md:text-base">Desde bouquets curados hasta ambientaciones integrales, cada propuesta parte de una mirada estética clara y un servicio cercano.</p>
        </section>

        <section className="w-full" aria-label="Líneas principales">
          <div className="grid gap-4 md:grid-cols-2">
            {featuredSections.map((item) => (
              <Link key={item.title} href={item.href} className="group relative min-h-[280px] overflow-hidden rounded-2xl">
                <Image src={item.image} alt={item.title} fill sizes={CARD_IMAGE_SIZES} className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm text-white/90">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="w-full rounded-3xl bg-stone-900 px-8 py-10 text-white md:px-12" aria-label="Banner emocional">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Rituales con intención</p>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">Cada arreglo cuenta una historia: la tuya.</h2>
          <p className="mt-3 max-w-3xl text-sm text-white/80 md:text-base">Trabajamos materia prima de temporada para construir atmósferas memorables con acabados impecables.</p>
          <Link href="/eventos" className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-medium text-stone-900 transition hover:bg-stone-200">Ver propuestas para eventos</Link>
        </section>

        <section className="w-full" aria-label="Carrusel editorial">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {sliderSlides.map((slide) => (
              <article key={slide.title} className="min-w-[84%] snap-center overflow-hidden rounded-2xl bg-stone-100 md:min-w-[48%] lg:min-w-[32%]">
                <div className="relative h-56">
                  <Image src={slide.image} alt={slide.title} fill sizes={CARD_IMAGE_SIZES} className="object-cover" />
                </div>
                <div className="space-y-2 p-5">
                  <h2 className="text-lg font-semibold text-stone-900">{slide.title}</h2>
                  <p className="text-sm text-stone-600">{slide.description}</p>
                  <Link href={slide.href} className="inline-flex text-sm font-medium text-stone-900 underline underline-offset-4">Explorar</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full rounded-3xl border border-stone-200 bg-white px-8 py-10 md:px-12" aria-label="Bloque de confianza y contacto">
          <h2 className="text-2xl font-semibold text-stone-900 md:text-3xl">¿Tienes una idea floral en mente?</h2>
          <p className="mt-3 max-w-2xl text-sm text-stone-600 md:text-base">Conversemos por WhatsApp o formulario y te compartimos una propuesta editorial adaptada a tu ocasión.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contacto" className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700">Hablar con el estudio</Link>
            <a href="https://wa.me/5491135599900" className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-500">WhatsApp</a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
