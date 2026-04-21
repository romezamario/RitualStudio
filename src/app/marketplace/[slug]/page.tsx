import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteShell from "@/components/site-shell";
import { getMarketplaceProductBySlug, marketplaceProducts } from "@/data/marketplace-products";
import ProductPurchaseActions from "@/components/product-purchase-actions";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return marketplaceProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getMarketplaceProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return {
    title: `${product.name} en Marketplace`,
    description: `${product.shortDescription} ${product.delivery}`,
    alternates: {
      canonical: `/marketplace/${product.slug}`
    },
    openGraph: {
      title: `${product.name} · Ritual Studio`,
      description: product.shortDescription,
      url: `/marketplace/${product.slug}`,
      type: "article",
      images: [
        {
          url: product.image,
          alt: product.name
        }
      ]
    }
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = getMarketplaceProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [product.image],
    description: product.description,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: "Ritual Studio"
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      availability: "https://schema.org/InStock",
      price: product.price.replace(/[^\d.]/g, "")
    }
  };

  return (
    <SiteShell
      eyebrow={`Marketplace · ${product.category}`}
      title={product.name}
      subtitle={`${product.shortDescription} ${product.delivery}`}
    >
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd)
        }}
      />
      <article className="product-detail">
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
    </SiteShell>
  );
}
