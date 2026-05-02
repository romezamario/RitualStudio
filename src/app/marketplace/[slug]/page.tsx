import Link from "next/link";
import SiteShell from "@/components/site-shell";
import MarketplaceClientEnhancer from "@/components/marketplace-client-enhancer";
import ProductPurchaseActions from "@/components/product-purchase-actions";
import ProductDetailImageLightbox from "@/components/product-detail-image-lightbox";
import {
  getMarketplaceProductBySlugForRender,
  getMarketplaceProductsForRender,
  isLocalMarketplaceFallbackEnabled,
} from "@/lib/marketplace-catalog";
import { toRenderableProductImageUrl } from "@/lib/product-image-storage";
import { getDeliveryCalendarRangeDays } from "@/lib/delivery-calendar-settings";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const products = await getMarketplaceProductsForRender();
  return products.map((product) => ({ slug: product.slug }));
}

const DETAIL_IMAGE_SIZES = "(max-width: 900px) 100vw, 48vw";

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const useClientFallback = isLocalMarketplaceFallbackEnabled();
  const products = await getMarketplaceProductsForRender();
  const product = await getMarketplaceProductBySlugForRender(slug);
  const deliveryCalendarRangeDays = await getDeliveryCalendarRangeDays();

  if (!product) {
    return (
      <SiteShell eyebrow="Marketplace" title="Producto no encontrado" subtitle="Revisa el catálogo disponible.">
        <Link href="/marketplace" className="btn btn-ghost">
          Volver al marketplace
        </Link>
      </SiteShell>
    );
  }

  return (
    <SiteShell
      eyebrow={`Marketplace · ${product.category}`}
      title={product.name}
      subtitle={`${product.shortDescription} ${product.delivery}`}
    >
      {useClientFallback ? (
        <MarketplaceClientEnhancer mode="detail" slug={product.slug} initialProducts={products} />
      ) : (
        <article className="product-detail">
          <ProductDetailImageLightbox
            imageSrc={toRenderableProductImageUrl(product.image, "product-detail")}
            imageAlt={product.name}
            sizes={DETAIL_IMAGE_SIZES}
            priority
          />

          <div className="product-detail-content">
            <p className="card-label">{product.category}</p>
            <h2>{product.name}</h2>
            <p>{product.description}</p>

            <div className="product-meta-grid">
              <section className="studio-card">
                <p className="card-label">Precio</p>
                {product.originalPrice ? <span className="price-old">{product.originalPrice}</span> : null}
                <strong className="price-tag">{product.price}</strong>
              </section>
              <section className="studio-card">
                <p className="card-label">Tamaño</p>
                <p>{product.size}</p>
              </section>
            </div>

            <div className="split-panel">
              <div>
                <h3>Flores incluidas</h3>
                <ul>
                  {product.flowers.map((flower) => (
                    <li key={flower}>{flower}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Ideal para</h3>
                <ul>
                  {product.idealFor.map((scenario) => (
                    <li key={scenario}>{scenario}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Entrega</h3>
                <p>{product.delivery}</p>
              </div>
            </div>

            <div className="cta-row">
              <ProductPurchaseActions
                product={product}
                showMarketplaceLink
                deliveryDatesToDisplay={deliveryCalendarRangeDays}
              />
            </div>
          </div>
        </article>
      )}
    </SiteShell>
  );
}
