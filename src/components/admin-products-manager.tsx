"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toRenderableProductImageUrl } from "@/lib/product-image-storage";
import { MAX_UPLOAD_IMAGE_BYTES, processImageBeforeUpload } from "@/lib/client-image-processing";
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
  isTestProduct: boolean;
};

const ADMIN_PREVIEW_IMAGE_SIZES = "(max-width: 900px) 100vw, 50vw";

const DEFAULT_DELIVERY_RANGE_DAYS = 14;
const MIN_DELIVERY_RANGE_DAYS = 7;
const MAX_DELIVERY_RANGE_DAYS = 60;

const initialForm: FormState = {
  slug: "",
  name: "",
  description: "",
  image: "",
  hasOffer: false,
  price: "",
  offerPrice: "",
  isTestProduct: false,
};

export default function AdminProductsManager() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deliveryRangeDays, setDeliveryRangeDays] = useState(String(DEFAULT_DELIVERY_RANGE_DAYS));
  const [isSavingDeliveryRange, setIsSavingDeliveryRange] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        const [productsResponse, deliverySettingsResponse] = await Promise.all([
          fetch("/api/admin/products", { method: "GET" }),
          fetch("/api/admin/products/delivery-settings", { method: "GET" }),
        ]);
        const response = productsResponse;
        const body = (await response.json().catch(() => null)) as
          | { data?: MarketplaceProduct[]; error?: string }
          | null;
        const deliverySettingsBody = (await deliverySettingsResponse.json().catch(() => null)) as
          | { days?: number }
          | null;

        if (!response.ok) {
          throw new Error(body?.error ?? "No fue posible cargar productos.");
        }

        if (!ignore) {
          setProducts(body?.data ?? []);
          setDeliveryRangeDays(String(deliverySettingsBody?.days ?? DEFAULT_DELIVERY_RANGE_DAYS));
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

    if (!file.type.startsWith("image/")) {
      setFeedback("Selecciona un archivo de imagen válido (JPG, PNG, WEBP o AVIF).");
      return;
    }

    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      setFeedback("La imagen supera el límite de 8MB. Reduce el tamaño antes de subirla.");
      return;
    }

    setIsUploadingImage(true);
    setFeedback("Procesando imagen...");

    try {
      const processed = await processImageBeforeUpload(file);
      const payload = new FormData();
      payload.set("file", processed.file);
      payload.set("width", String(processed.width));
      payload.set("height", String(processed.height));
      payload.set("processed_mime_type", processed.outputMimeType);
      payload.set("original_filename", processed.originalFilename);

      setFeedback("Subiendo imagen a storage...");
      const response = await fetch("/api/admin/products/upload-image", {
        method: "POST",
        body: payload,
      });

      const body = (await response.json().catch(() => null)) as
        | { data?: { image?: string; publicUrl?: string; renderUrl?: string; optimizationHint?: string }; error?: string }
        | null;

      if (!response.ok || !body?.data?.image) {
        throw new Error(body?.error ?? "No fue posible subir la imagen.");
      }

      setForm((current) => ({ ...current, image: body.data?.image ?? "" }));
      setFeedback(body?.data?.optimizationHint ?? "Imagen subida correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible subir la imagen.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUploadingImage) {
      setFeedback("Espera a que termine la subida de imagen.");
      return;
    }

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
          isTestProduct: form.isTestProduct,
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
          isTestProduct: form.isTestProduct,
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


  const handleSaveDeliveryRange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = Number(deliveryRangeDays);
    if (!Number.isFinite(parsed) || parsed < MIN_DELIVERY_RANGE_DAYS || parsed > MAX_DELIVERY_RANGE_DAYS) {
      setFeedback(`Define un rango entre ${MIN_DELIVERY_RANGE_DAYS} y ${MAX_DELIVERY_RANGE_DAYS} días.`);
      return;
    }

    setIsSavingDeliveryRange(true);

    try {
      const response = await fetch("/api/admin/products/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: parsed }),
      });

      const body = (await response.json().catch(() => null)) as { days?: number; error?: string } | null;

      if (!response.ok || !body?.days) {
        throw new Error(body?.error ?? "No fue posible guardar el rango del calendario.");
      }

      setDeliveryRangeDays(String(body.days));
      setFeedback("Configuración de calendario de entrega actualizada.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible guardar la configuración.");
    } finally {
      setIsSavingDeliveryRange(false);
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
      isTestProduct: Boolean(product.isTestProduct),
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

        <form className="studio-form" onSubmit={handleSaveDeliveryRange}>
          <label>
            Rango de fechas para calendario de entrega (días)
            <input
              type="number"
              min={MIN_DELIVERY_RANGE_DAYS}
              max={MAX_DELIVERY_RANGE_DAYS}
              value={deliveryRangeDays}
              onChange={(event) => setDeliveryRangeDays(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-ghost" disabled={isSavingDeliveryRange}>
            {isSavingDeliveryRange ? "Guardando..." : "Guardar rango de calendario"}
          </button>
        </form>

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
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void handleImageUpload(event.target.files?.[0])}
              disabled={isUploadingImage}
            />
          </label>

          {isUploadingImage ? <p>Subiendo imagen...</p> : null}

          {form.image ? (
            <Image
              src={toRenderableProductImageUrl(form.image, "admin-preview")}
              alt="Vista previa"
              className="admin-product-preview"
              width={1200}
              height={900}
              unoptimized
              sizes={ADMIN_PREVIEW_IMAGE_SIZES}
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

          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.isTestProduct}
              onChange={(event) => setForm((current) => ({ ...current, isTestProduct: event.target.checked }))}
            />
            Marcar como producto de prueba (solo visible para admin)
          </label>

          <div className="cta-row">
            <button type="submit" className="btn btn-primary" disabled={isUploadingImage}>
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
        {loading ? <p>Cargando productos...</p> : null}
        <div className="admin-products-list">
          {sortedProducts.map((product) => (
            <article key={product.slug} className="admin-product-item">
              <div>
                <p className="card-label">{product.category}{product.isTestProduct ? " · Prueba" : ""}</p>
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
