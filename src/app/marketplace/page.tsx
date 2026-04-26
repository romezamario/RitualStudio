import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/components/site-shell";
import MarketplaceClientEnhancer from "@/components/marketplace-client-enhancer";
import ProductPurchaseActions from "@/components/product-purchase-actions";
import { marketplaceProducts } from "@/data/marketplace-products";

const CARD_IMAGE_SIZES = "(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 33vw";

function getCategoryId(category: string) {
  return `categoria-${category.toLowerCase().replace(/\s+/g, "-")}`;
}

export default function MarketplacePage() {
  const categories = Array.from(new Set(marketplaceProducts.map((product) => product.category)));

  return (
    <SiteShell
      eyebrow="Marketplace Ritual Studio"
      title="Explora productos con scroll y categorías"
      subtitle="Desliza hacia abajo para descubrir ramos, centros de mesa, eventos y regalos. Cada producto tiene su ficha de detalle con información ampliada."
    >
      <div id="marketplace-server-content">
        <div className="marketplace-topbar" aria-label="Categorías de productos">
          {categories.map((category) => (
            <a key={category} href={`#${getCategoryId(category)}`} className="chip-link">
              {category}
            </a>
          ))}
        </div>

        <p className="scroll-hint">Scroll down ↓ para seguir explorando el catálogo completo.</p>

        {categories.map((category) => {
          const categoryProducts = marketplaceProducts.filter((product) => product.category === category);

          return (
            <section
              key={category}
              id={getCategoryId(category)}
              className="marketplace-section"
              aria-label={`Categoría ${category}`}
            >
              <h2>{category}</h2>
              <div className="feature-grid">
                {categoryProducts.map((product) => (
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
          );
        })}
      </div>

      <MarketplaceClientEnhancer mode="list" initialProducts={marketplaceProducts} />
    </SiteShell>
  );
}
