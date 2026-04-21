import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const siteName = "Ritual Studio";
const defaultSiteUrl = "https://ritualstudio.vercel.app";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl;
const metadataBase = (() => {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL(defaultSiteUrl);
  }
})();

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Florist",
  name: siteName,
  url: metadataBase.origin,
  areaServed: "MX",
  address: {
    "@type": "PostalAddress",
        addressCountry: "MX"
  },
  sameAs: ["https://wa.me/525520904940"]
};

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Ritual Studio | Arreglos florales premium",
    template: `%s | ${siteName}`
  },
  description:
    "Diseño floral editorial: ramos premium, arreglos personalizados, eventos y compra por WhatsApp.",
  keywords: [
    "florería premium",
    "arreglos florales premium",
    "ramos a domicilio",
    "flores para eventos",
    "diseño floral editorial",
    "Ritual Studio"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Ritual Studio | Arreglos florales premium",
    description:
      "Creamos arreglos florales personalizados para regalos, eventos y espacios con dirección artística para distintas ciudades.",
    url: "/",
    siteName,
    locale: "es_MX",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Ritual Studio | Arreglos florales premium",
    description: "Ramos, centros y eventos con diseño floral editorial para distintas ciudades."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className={`${playfair.variable} ${inter.variable}`}>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd)
          }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
