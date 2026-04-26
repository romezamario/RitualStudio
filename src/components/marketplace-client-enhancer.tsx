"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import ProductPurchaseActions from "@/components/product-purchase-actions";
import { getStoredMarketplaceProducts } from "@/lib/marketplace-catalog";

type MarketplaceClientEnhancerProps = {
  mode: "list" | "detail";
  initialProducts: MarketplaceProduct[];
  slug?: string;
};

const CARD_IMAGE_SIZES = "(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 33vw";
const DETAIL_IMAGE_SIZES = "(max-width: 900px) 100vw, 48vw";

function getCategoryId(category: string) {
  return `categoria-${category.toLowerCase().replace(/\s+/g, "-")}`;
}

export default function MarketplaceClientEnhancer({ mode, initialProducts, slug }: MarketplaceClientEnhancerProps) {
  const [overrideProducts, setOverrideProducts] = useState<MarketplaceProduct[] | null>(null);

  useEffect(() => {
    const storedProducts = getStoredMarketplaceProducts();

    if (JSON.stringify(storedProducts) !== JSON.stringify(initialProducts)) {
      setOverrideProducts(storedProducts);
    }
  }, [initialProducts]);

  const shouldRenderListOverride = mode === "list" && !!overrideProducts;
  const groupedOverrideProducts = useMemo(() => {
    if (mode !== "list" || !overrideProducts) {
      return [];
    }

    const grouped = overrideProducts.reduce<Record<string, MarketplaceProduct[]>>((accumulator, product) => {
      if (!accumulator[product.category]) {
        accumulator[product.category] = [];
      }

      accumulator[product.category].push(product);
      return accumulator;
    }, {});

    return Object.entries(grouped).map(([category, products]) => ({ category, products }));
  }, [mode, overrideProducts]);
  const overrideCategories = useMemo(
    () => groupedOverrideProducts.map((section) => section.category),
    [groupedOverrideProducts],
  );
  const detailProduct = useMemo(() => {
    if (mode !== "detail" || !overrideProducts || !slug) {
      return null;
    }

    return overrideProducts.find((product) => product.slug === slug) ?? null;
  }, [mode, overrideProducts, slug]);
  const shouldRenderDetailOverride = mode === "detail" && !!detailProduct;

  useEffect(() => {
    const shouldEnableOverride = shouldRenderListOverride || shouldRenderDetailOverride;
    const root = document.documentElement;

    root.classList.toggle("marketplace-overrides-active", shouldEnableOverride);

    return () => {
      root.classList.remove("marketplace-overrides-active");
    };
  }, [shouldRenderDetailOverride, shouldRenderListOverride]);

  if (shouldRenderListOverride && overrideProducts) {
    return (
      <div className="marketplace-client-override" aria-label="Marketplace con personalizaciones de admin">
        <div className="marketplace-topbar" aria-label="Categorías de productos">
          {overrideCategories.map((category) => (
            <a key={category} href={`#${getCategoryId(category)}`} className="chip-link">
              {category}
            </a>
          ))}
        </div>

        <p className="scroll-hint">Scroll down ↓ para seguir explorando el catálogo completo.</p>

        {groupedOverrideProducts.map((section) => (
          <section
            key={section.category}
            id={getCategoryId(section.category)}
            className="marketplace-section"
            aria-label={`Categoría ${section.category}`}
          >
            <h2>{section.category}</h2>
            <div className="feature-grid">
              {section.products.map((product) => (
                <article key={product.slug} className="studio-card marketplace-card">
                  <div className="card-image-wrap">
                    <Image
                      className="card-image"
                      src={product.image}
                      alt={product.name}
                      width={1200}
                      height={900}
                      sizes={CARD_IMAGE_SIZES}
                    />
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
        ))}
      </div>
    );
  }

  if (shouldRenderDetailOverride && detailProduct) {
    return (
      <article className="product-detail marketplace-client-override" aria-label="Detalle con personalizaciones de admin">
        <div className="product-detail-image-wrap">
          <Image
            src={detailProduct.image}
            alt={detailProduct.name}
            width={1400}
            height={1000}
            className="product-detail-image"
            sizes={DETAIL_IMAGE_SIZES}
          />
        </div>

        <div className="product-detail-content">
          <p className="card-label">{detailProduct.category}</p>
          <h2>{detailProduct.name}</h2>
          <p>{detailProduct.description}</p>

          <div className="product-meta-grid">
            <section className="studio-card">
              <p className="card-label">Precio</p>
              {detailProduct.originalPrice ? <span className="price-old">{detailProduct.originalPrice}</span> : null}
              <strong className="price-tag">{detailProduct.price}</strong>
            </section>
            <section className="studio-card">
              <p className="card-label">Tamaño</p>
              <p>{detailProduct.size}</p>
            </section>
          </div>

          <div className="split-panel">
            <div>
              <h3>Flores incluidas</h3>
              <ul>
                {detailProduct.flowers.map((flower) => (
                  <li key={flower}>{flower}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Ideal para</h3>
              <ul>
                {detailProduct.idealFor.map((scenario) => (
                  <li key={scenario}>{scenario}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Entrega</h3>
              <p>{detailProduct.delivery}</p>
            </div>
          </div>

          <div className="cta-row">
            <Link href="/marketplace" className="btn btn-ghost">
              Volver al marketplace
            </Link>
            <ProductPurchaseActions product={detailProduct} />
          </div>
        </div>
      </article>
    );
  }

  return null;
}
