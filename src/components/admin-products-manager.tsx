"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import {
  buildMarketplaceProduct,
  getStoredMarketplaceProducts,
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
  const [products, setProducts] = useState<MarketplaceProduct[]>(() => getStoredMarketplaceProducts());
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name, "es-MX")),
    [products],
  );

  const persist = (nextProducts: MarketplaceProduct[]) => {
    setProducts(nextProducts);
    saveStoredMarketplaceProducts(nextProducts);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingSlug(null);
  };

  const handleImageUpload = (file?: File | null) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, image: dataUrl }));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    persist(nextProducts);
    resetForm();
    setFeedback(editingSlug ? "Producto actualizado." : "Producto dado de alta correctamente.");
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
            Foto del producto
            <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event.target.files?.[0])} />
          </label>

          {form.image ? (
            <Image src={form.image} alt="Vista previa" className="admin-product-preview" width={1200} height={900} unoptimized />
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
            <button type="submit" className="btn btn-primary">
              {editingSlug ? "Guardar cambios" : "Dar de alta"}
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
              <button type="button" className="btn btn-ghost" onClick={() => startEdit(product)}>
                Editar
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
