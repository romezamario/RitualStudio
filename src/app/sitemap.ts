import type { MetadataRoute } from "next";
import { marketplaceProducts } from "@/data/marketplace-products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ritualstudio.vercel.app";

const staticRoutes = [
  "",
  "/marketplace",
  "/cursos",
  "/custom",
  "/eventos",
  "/nosotros",
  "/contacto",
  "/carrito",
  "/login",
  "/aviso-de-privacidad"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  })) satisfies MetadataRoute.Sitemap;

  const productEntries = marketplaceProducts.map((product) => ({
    url: `${siteUrl}/marketplace/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8
  })) satisfies MetadataRoute.Sitemap;

  return [...staticEntries, ...productEntries];
}
