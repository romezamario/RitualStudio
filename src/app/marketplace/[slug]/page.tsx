import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import MarketplaceClientEnhancer from "@/components/marketplace-client-enhancer";
import ProductPurchaseActions from "@/components/product-purchase-actions";
import { getMarketplaceProductBySlug, marketplaceProducts } from "@/data/marketplace-products";

type ProductDetailPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return marketplaceProducts.map((product) => ({ slug: product.slug }));
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = getMarketplaceProductBySlug(params.slug);

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
      <article id="marketplace-server-content" className="product-detail">
        <div className="product-detail-image-wrap">
          <Image src={product.image} alt={product.name} width={1400} height={1000} className="product-detail-image" />
        </div>

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
            <Link href="/marketplace" className="btn btn-ghost">
              Volver al marketplace
            </Link>
            <ProductPurchaseActions product={product} />
          </div>
        </div>
      </article>

      <MarketplaceClientEnhancer mode="detail" slug={product.slug} initialProducts={marketplaceProducts} />
    </SiteShell>
  );
}
