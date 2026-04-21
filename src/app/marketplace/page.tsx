import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/components/site-shell";
import { marketplaceCategories, marketplaceProducts } from "@/data/marketplace-products";
import ProductPurchaseActions from "@/components/product-purchase-actions";

export const metadata: Metadata = {
  title: "Marketplace floral en CDMX",
  description:
    "Catálogo de ramos, centros de mesa y regalos de Ritual Studio con opciones de compra directa por WhatsApp.",
  alternates: {
    canonical: "/marketplace"
  },
  openGraph: {
    title: "Marketplace floral en CDMX",
    description: "Explora categorías de arreglos florales premium y revisa el detalle de cada producto.",
    url: "/marketplace"
  }
};

export default function MarketplacePage() {
  return (
    <SiteShell
      eyebrow="Marketplace Ritual Studio"
      title="Explora productos con scroll y categorías"
      subtitle="Desliza hacia abajo para descubrir ramos, centros de mesa, eventos y regalos. Cada producto tiene su ficha de detalle con información ampliada."
    >
      <div className="marketplace-topbar" aria-label="Categorías de productos">
        {marketplaceCategories.map((category) => {
          const categoryId = `categoria-${category.toLowerCase().replace(/\s+/g, "-")}`;

          return (
            <a key={category} href={`#${categoryId}`} className="chip-link">
              {category}
            </a>
          );
        })}
      </div>

      <p className="scroll-hint">Scroll down ↓ para seguir explorando el catálogo completo.</p>

      {marketplaceCategories.map((category) => {
        const categoryId = `categoria-${category.toLowerCase().replace(/\s+/g, "-")}`;
        const products = marketplaceProducts.filter((product) => product.category === category);

        return (
          <section key={category} id={categoryId} className="marketplace-section" aria-label={`Categoría ${category}`}>
            <h2>{category}</h2>
            <div className="feature-grid">
              {products.map((product) => (
                <article key={product.slug} className="studio-card marketplace-card">
                  <div className="card-image-wrap">
                    <Image className="card-image" src={product.image} alt={product.name} width={1200} height={900} />
                  </div>
                  <p className="card-label">{product.category}</p>
                  <h3>{product.name}</h3>
                  <p>{product.shortDescription}</p>
                  <strong className="price-tag">{product.price}</strong>
                  <div className="marketplace-card-actions">
                    <Link href={`/marketplace/${product.slug}`} className="btn btn-ghost">
                      Ver detalle
                    </Link>
                    <ProductPurchaseActions product={product} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </SiteShell>
  );
}
