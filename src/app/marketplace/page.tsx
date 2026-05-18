import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/components/site-shell";
import MarketplaceClientEnhancer from "@/components/marketplace-client-enhancer";
import ProductPurchaseActions from "@/components/product-purchase-actions";
import { getMarketplaceProductsForRender, isLocalMarketplaceFallbackEnabled } from "@/lib/marketplace-catalog";
import { toRenderableProductImageUrl } from "@/lib/product-image-storage";
import { getCurrentUserProfile } from "@/lib/supabase/server";

const CARD_IMAGE_SIZES = "(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 33vw";
const FEATURED_IMAGE_SIZES = "(max-width: 900px) 100vw, (max-width: 1280px) 65vw, 720px";

function getCategoryId(category: string) {
  return `categoria-${category.toLowerCase().replace(/\s+/g, "-")}`;
}

export default async function MarketplacePage() {
  const useClientFallback = isLocalMarketplaceFallbackEnabled();
  const allProducts = await getMarketplaceProductsForRender();
  const { isAdmin } = await getCurrentUserProfile();
  const products = allProducts.filter((product) => !product.isTestProduct || isAdmin);
  const categories = Array.from(new Set(products.map((product) => product.category)));

  return (
    <SiteShell
      eyebrow="Tienda floral"
      title="Ramos, centros y regalos listos para enviar"
      subtitle="Explora la seleccion por categoria. Cada pieza conserva su ficha de detalle, calendario de entrega y flujo de compra actual."
    >
      {useClientFallback ? (
        <MarketplaceClientEnhancer mode="list" initialProducts={products} />
      ) : (
        <div>
          <article className="studio-card" style={{ marginBottom: "1.2rem" }}>
            <p className="card-label">Tambien disponible</p>
            <h2 style={{ marginTop: "0.2rem" }}>Talleres presenciales de diseno floral</h2>
            <p>Si prefieres aprender paso a paso, revisa las experiencias activas y compra tu lugar por sesion.</p>
            <Link href="/cursos" className="btn btn-ghost">
              Ver talleres
            </Link>
          </article>

          <div className="marketplace-topbar" aria-label="Categorias de productos">
            {categories.map((category) => (
              <a key={category} href={`#${getCategoryId(category)}`} className="chip-link">
                {category}
              </a>
            ))}
          </div>

          <p className="scroll-hint">Explora la curaduria completa del estudio.</p>

          {categories.map((category) => {
            const categoryProducts = products.filter((product) => product.category === category);
            const [featuredProduct, ...secondaryProducts] = categoryProducts;

            return (
              <section
                key={category}
                id={getCategoryId(category)}
                className="marketplace-section marketplace-editorial-section"
                aria-label={`Categoria ${category}`}
              >
                <div className="marketplace-section-heading">
                  <p className="card-label">Seleccion por categoria</p>
                  <h2>{category}</h2>
                </div>

                {featuredProduct ? (
                  <article className="studio-card marketplace-featured-card">
                    <div className="card-image-wrap marketplace-featured-image-wrap">
                      <Image
                        className="card-image marketplace-featured-image"
                        src={toRenderableProductImageUrl(featuredProduct.image, "marketplace-list")}
                        alt={featuredProduct.name}
                        width={1400}
                        height={900}
                        sizes={FEATURED_IMAGE_SIZES}
                        priority={category === categories[0]}
                      />
                    </div>
                    <div className="marketplace-featured-copy">
                      <p className="card-label">Pieza destacada / {featuredProduct.category}</p>
                      <h3>{featuredProduct.name}</h3>
                      <p>{featuredProduct.shortDescription}</p>
                      <div className="price-stack">
                        {featuredProduct.originalPrice ? <span className="price-old">{featuredProduct.originalPrice}</span> : null}
                        <strong className="price-tag">{featuredProduct.price}</strong>
                      </div>
                      <div className="marketplace-card-actions marketplace-featured-actions">
                        <Link href={`/marketplace/${featuredProduct.slug}`} className="btn btn-ghost">
                          Ver detalle
                        </Link>
                        <ProductPurchaseActions product={featuredProduct} showDeliveryCalendar={false} />
                      </div>
                    </div>
                  </article>
                ) : null}

                {secondaryProducts.length > 0 ? (
                  <div className="marketplace-secondary-grid">
                    {secondaryProducts.map((product) => (
                      <article key={product.slug} className="studio-card marketplace-card marketplace-secondary-card">
                        <div className="card-image-wrap marketplace-secondary-image-wrap">
                          <Image
                            className="card-image marketplace-secondary-image"
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
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </SiteShell>
  );
}
