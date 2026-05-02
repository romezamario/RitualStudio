import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/components/site-shell";
import MarketplaceClientEnhancer from "@/components/marketplace-client-enhancer";
import ProductPurchaseActions from "@/components/product-purchase-actions";
import { getMarketplaceProductsForRender, isLocalMarketplaceFallbackEnabled } from "@/lib/marketplace-catalog";
import { toRenderableProductImageUrl } from "@/lib/product-image-storage";

const CARD_IMAGE_SIZES = "(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 33vw";

function getCategoryId(category: string) {
  return `categoria-${category.toLowerCase().replace(/\s+/g, "-")}`;
}

export default async function MarketplacePage() {
  const useClientFallback = isLocalMarketplaceFallbackEnabled();
  const products = await getMarketplaceProductsForRender();
  const categories = Array.from(new Set(products.map((product) => product.category)));

  return (
    <SiteShell
      eyebrow="Marketplace Ritual Studio"
      title="Explora productos con scroll y categorías"
      subtitle="Desliza hacia abajo para descubrir ramos, centros de mesa, eventos y regalos. Cada producto tiene su ficha de detalle con información ampliada."
    >
      {useClientFallback ? (
        <MarketplaceClientEnhancer mode="list" initialProducts={products} />
      ) : (
        <div>
          <article className="studio-card" style={{ marginBottom: "1.2rem" }}>
            <p className="card-label">También disponible</p>
            <h2 style={{ marginTop: "0.2rem" }}>Cursos presenciales de diseño floral</h2>
            <p>Si prefieres aprender paso a paso, revisa las experiencias activas y compra tu lugar por sesión.</p>
            <Link href="/cursos" className="btn btn-ghost">
              Ver experiencias
            </Link>
          </article>

          <div className="marketplace-topbar" aria-label="Categorías de productos">
            {categories.map((category) => (
              <a key={category} href={`#${getCategoryId(category)}`} className="chip-link">
                {category}
              </a>
            ))}
          </div>

          <p className="scroll-hint">Scroll down ↓ para seguir explorando el catálogo completo.</p>

          {categories.map((category) => {
            const categoryProducts = products.filter((product) => product.category === category);

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
                          src={toRenderableProductImageUrl(product.image, "marketplace-list")}
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
                        <ProductPurchaseActions product={product} showDeliveryCalendar={false} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </SiteShell>
  );
}
