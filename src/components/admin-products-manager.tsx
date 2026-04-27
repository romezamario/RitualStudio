"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import {
  buildMarketplaceProduct,
  getStoredMarketplaceProducts,
  isLocalMarketplaceFallbackEnabled,
  saveStoredMarketplaceProducts,
} from "@/lib/marketplace-catalog";

type FormState = {
  slug: string;
  name: string;
  description: string;
  image: string;
  hasOffer: boolean;
  price: string;
  offerPrice: string;
};

const initialForm: FormState = {
  slug: "",
  name: "",
  description: "",
  image: "",
  hasOffer: false,
  price: "",
  offerPrice: "",
};

export default function AdminProductsManager() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/admin/products", { method: "GET" });
        const body = (await response.json().catch(() => null)) as
          | { data?: MarketplaceProduct[]; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(body?.error ?? "No fue posible cargar productos.");
        }

        if (!ignore) {
          setProducts(body?.data ?? []);
          setFeedback("");
        }
      } catch (error) {
        if (!ignore) {
          if (isLocalMarketplaceFallbackEnabled()) {
            const fallbackProducts = getStoredMarketplaceProducts();
            setProducts(fallbackProducts);
            setFeedback("No fue posible cargar desde backend. Se usó fallback local.");
          } else {
            setFeedback(error instanceof Error ? error.message : "No fue posible cargar productos.");
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name, "es-MX")),
    [products],
  );

  const persistLocalFallback = (nextProducts: MarketplaceProduct[]) => {
    if (isLocalMarketplaceFallbackEnabled()) {
      saveStoredMarketplaceProducts(nextProducts);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingSlug(null);
  };

  const handleImageUpload = async (file?: File | null) => {
    if (!file) {
      return;
    }

    try {
      setUploadingImage(true);
      setFeedback("Subiendo imagen...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/products/upload-image", {
        method: "POST",
        body: formData,
      });

      const body = (await response.json().catch(() => null)) as
        | { data?: { publicUrl?: string; path?: string }; error?: string }
        | null;

      if (!response.ok || !body?.data?.publicUrl) {
        throw new Error(body?.error ?? "No fue posible subir la imagen.");
      }

      setForm((current) => ({ ...current, image: body.data?.publicUrl ?? "" }));
      setFeedback("Imagen subida correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const basePrice = Number(form.price);
    const offerPrice = Number(form.offerPrice);

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setFeedback("Ingresa un precio válido mayor a 0.");
      return;
    }

    if (form.hasOffer && (!Number.isFinite(offerPrice) || offerPrice <= 0)) {
      setFeedback("Si activas oferta, ingresa un precio de oferta válido.");
      return;
    }

    if (form.hasOffer && offerPrice >= basePrice) {
      setFeedback("El precio de oferta debe ser menor al precio normal.");
      return;
    }

    try {
      const response = await fetch(editingSlug ? `/api/admin/products/${editingSlug}` : "/api/admin/products", {
        method: editingSlug ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: form.slug,
          name: form.name,
          description: form.description,
          image:
            form.image ||
            "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=80",
          hasOffer: form.hasOffer,
          price: basePrice,
          offerPrice: form.hasOffer ? offerPrice : undefined,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { data?: MarketplaceProduct; error?: string }
        | null;

      if (!response.ok || !body?.data) {
        throw new Error(body?.error ?? "No fue posible guardar el producto.");
      }

      const nextProducts = editingSlug
        ? products.map((item) => (item.slug === editingSlug ? body.data! : item))
        : [body.data, ...products.filter((item) => item.slug !== body.data!.slug)];

      setProducts(nextProducts);
      persistLocalFallback(nextProducts);
      resetForm();
      setFeedback(editingSlug ? "Producto actualizado." : "Producto dado de alta correctamente.");
    } catch (error) {
      if (isLocalMarketplaceFallbackEnabled()) {
        const product = buildMarketplaceProduct({
          slug: form.slug,
          name: form.name,
          description: form.description,
          image:
            form.image ||
            "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=80",
          hasOffer: form.hasOffer,
          price: basePrice,
          offerPrice: form.hasOffer ? offerPrice : undefined,
        });

        const nextProducts = editingSlug
          ? products.map((item) => (item.slug === editingSlug ? { ...product, slug: editingSlug } : item))
          : [product, ...products.filter((item) => item.slug !== product.slug)];

        setProducts(nextProducts);
        persistLocalFallback(nextProducts);
        resetForm();
        setFeedback("Backend no disponible. Cambio guardado en fallback local.");
        return;
      }

      setFeedback(error instanceof Error ? error.message : "No fue posible guardar el producto.");
    }
  };

  const startEdit = (product: MarketplaceProduct) => {
    setEditingSlug(product.slug);
    setForm({
      slug: product.slug,
      name: product.name,
      description: product.description,
      image: product.image,
      hasOffer: Boolean(product.hasOffer),
      price: (product.originalPrice ?? product.price).replace(/[^\d]/g, ""),
      offerPrice: product.hasOffer ? product.price.replace(/[^\d]/g, "") : "",
    });
  };

  const handleDelete = async (slug: string) => {
    try {
      const response = await fetch(`/api/admin/products/${slug}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "No fue posible eliminar el producto.");
      }

      const nextProducts = products.filter((product) => product.slug !== slug);
      setProducts(nextProducts);
      persistLocalFallback(nextProducts);
      setFeedback("Producto eliminado.");
    } catch (error) {
      if (isLocalMarketplaceFallbackEnabled()) {
        const nextProducts = products.filter((product) => product.slug !== slug);
        setProducts(nextProducts);
        persistLocalFallback(nextProducts);
        setFeedback("Backend no disponible. Eliminación aplicada en fallback local.");
        return;
      }

      setFeedback(error instanceof Error ? error.message : "No fue posible eliminar el producto.");
    }
  };

  return (
    <div className="split-panel admin-products-layout">
      <section className="studio-card">
        <p className="card-label">Alta y edición</p>
        <h2>{editingSlug ? "Editar producto" : "Dar de alta producto"}</h2>

        <form className="studio-form admin-product-form" onSubmit={handleSubmit}>
          <label>
            Nombre del producto
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label>
            Descripción del producto
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <label>
            URL de imagen (Supabase Storage)
            <input
              required
              type="url"
              placeholder="https://<project-ref>.supabase.co/storage/v1/object/public/product-images/..."
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            />
          </label>

          <label>
            Foto del producto
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void handleImageUpload(event.target.files?.[0])}
              disabled={uploadingImage}
            />
          </label>

          {form.image ? (
            <Image
              src={form.image}
              alt="Vista previa"
              className="admin-product-preview"
              width={1200}
              height={900}
              unoptimized
            />
          ) : null}

          <label>
            Precio normal (MXN)
            <input
              required
              type="number"
              min="1"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            />
          </label>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.hasOffer}
              onChange={(event) => setForm((current) => ({ ...current, hasOffer: event.target.checked }))}
            />
            ¿Este producto tendrá oferta?
          </label>

          {form.hasOffer ? (
            <label>
              Precio de oferta (MXN)
              <input
                required
                type="number"
                min="1"
                value={form.offerPrice}
                onChange={(event) => setForm((current) => ({ ...current, offerPrice: event.target.value }))}
              />
            </label>
          ) : null}

          <div className="cta-row">
            <button type="submit" className="btn btn-primary" disabled={uploadingImage}>
              {uploadingImage ? "Subiendo imagen..." : editingSlug ? "Guardar cambios" : "Dar de alta"}
            </button>
            {editingSlug ? (
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Cancelar edición
              </button>
            ) : null}
          </div>
        </form>

        {feedback ? <p className="cart-feedback">{feedback}</p> : null}
      </section>

      <section className="studio-card">
        <p className="card-label">Catálogo actual</p>
        <h2>Productos registrados</h2>
        {loading ? <p>Cargando productos...</p> : null}
        <div className="admin-products-list">
          {sortedProducts.map((product) => (
            <article key={product.slug} className="admin-product-item">
              <div>
                <p className="card-label">{product.category}</p>
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>
                {product.originalPrice ? (
                  <p>
                    <span className="price-old">{product.originalPrice}</span> <strong>{product.price}</strong>
                  </p>
                ) : (
                  <strong>{product.price}</strong>
                )}
              </div>
              <div className="cta-row">
                <button type="button" className="btn btn-ghost" onClick={() => startEdit(product)}>
                  Editar
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => void handleDelete(product.slug)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
