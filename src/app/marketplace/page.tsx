"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import SiteShell from "@/components/site-shell";
import ProductPurchaseActions from "@/components/product-purchase-actions";
import { getStoredMarketplaceProducts } from "@/lib/marketplace-catalog";
import type { MarketplaceProduct } from "@/data/marketplace-products";

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);

  useEffect(() => {
    setProducts(getStoredMarketplaceProducts());
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products],
  );

  return (
    <SiteShell
      eyebrow="Marketplace Ritual Studio"
      title="Explora productos con scroll y categorías"
      subtitle="Desliza hacia abajo para descubrir ramos, centros de mesa, eventos y regalos. Cada producto tiene su ficha de detalle con información ampliada."
    >
      <div className="marketplace-topbar" aria-label="Categorías de productos">
        {categories.map((category) => {
          const categoryId = `categoria-${category.toLowerCase().replace(/\s+/g, "-")}`;

          return (
            <a key={category} href={`#${categoryId}`} className="chip-link">
              {category}
            </a>
          );
        })}
      </div>

      <p className="scroll-hint">Scroll down ↓ para seguir explorando el catálogo completo.</p>

      {categories.map((category) => {
        const categoryId = `categoria-${category.toLowerCase().replace(/\s+/g, "-")}`;
        const categoryProducts = products.filter((product) => product.category === category);

        return (
          <section key={category} id={categoryId} className="marketplace-section" aria-label={`Categoría ${category}`}>
            <h2>{category}</h2>
            <div className="feature-grid">
              {categoryProducts.map((product) => (
                <article key={product.slug} className="studio-card marketplace-card">
                  <div className="card-image-wrap">
                    <Image className="card-image" src={product.image} alt={product.name} width={1200} height={900} />
                  </div>
                  <p className="card-label">{product.category}</p>
                  <h3>{product.name}</h3>
                  <p>{product.shortDescription}</p>
                  <div className="price-stack">
                    {product.originalPrice ? <span className="price-old">{product.originalPrice}</span> : null}
                    <strong className="price-tag">{product.price}</strong>
                  </div>
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
