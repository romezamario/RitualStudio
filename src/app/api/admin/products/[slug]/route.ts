import { NextResponse } from "next/server";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import { supabaseAdminRequest } from "@/lib/supabase-admin";
import {
  buildMarketplaceProduct,
  toSupabaseMarketplaceProductRecord,
  type EditableMarketplaceProductInput,
} from "@/lib/marketplace-catalog";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import { isDataImageUrl, normalizeProductImageReference } from "@/lib/product-image-storage";

type ProductRow = {
  slug: string;
  name: string;
  category: MarketplaceProduct["category"];
  price: string;
  image: string;
  short_description: string;
  description: string;
  size: string;
  flowers: string[] | null;
  ideal_for: string[] | null;
  delivery: string;
  original_price: string | null;
  has_offer: boolean | null;
  is_test_product: boolean | null;
};

function toMarketplaceProduct(record: ProductRow): MarketplaceProduct {
  return {
    slug: record.slug,
    name: record.name,
    category: record.category,
    price: record.price,
    image: record.image,
    shortDescription: record.short_description,
    description: record.description,
    size: record.size,
    flowers: record.flowers ?? [],
    idealFor: record.ideal_for ?? [],
    delivery: record.delivery,
    originalPrice: record.original_price ?? undefined,
    hasOffer: record.has_offer ?? false,
    isTestProduct: record.is_test_product ?? false,
  };
}

function asEditableInput(payload: unknown): EditableMarketplaceProductInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name : "";
  const description = typeof raw.description === "string" ? raw.description : "";
  const rawImage = typeof raw.image === "string" ? raw.image : "";
  const image = normalizeProductImageReference(rawImage);
  const price = typeof raw.price === "number" ? raw.price : Number(raw.price);
  const hasOffer = Boolean(raw.hasOffer);
  const offerPrice = typeof raw.offerPrice === "number" ? raw.offerPrice : Number(raw.offerPrice);
  const isTestProduct = Boolean(raw.isTestProduct);
  const size = typeof raw.size === "string" ? raw.size : "";
  const flowers = Array.isArray(raw.flowers)
    ? raw.flowers.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  if (!name.trim() || !description.trim() || !image.trim() || !size.trim() || flowers.length === 0 || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  if (isDataImageUrl(rawImage)) {
    return null;
  }

  if (hasOffer && (!Number.isFinite(offerPrice) || offerPrice <= 0 || offerPrice >= price)) {
    return null;
  }

  return {
    name,
    description,
    image,
    size,
    flowers,
    hasOffer,
    price,
    offerPrice: hasOffer ? offerPrice : undefined,
    isTestProduct,
  };
}

async function assertAdmin() {
  const { user, isAdmin } = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  return null;
}

export async function PUT(request: Request, context: { params: Promise<{ slug: string }> }) {
  const guard = await assertAdmin();

  if (guard) {
    return guard;
  }

  const { slug } = await context.params;
  const payload = asEditableInput(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Payload de producto inválido." }, { status: 400 });
  }

  const product = buildMarketplaceProduct({ ...payload, slug });
  const productRow = toSupabaseMarketplaceProductRecord(product);

  const { data, error } = await supabaseAdminRequest<ProductRow[]>(
    `/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&select=slug,name,category,price,image,short_description,description,size,flowers,ideal_for,delivery,original_price,has_offer,is_test_product`,
    {
      method: "PATCH",
      body: JSON.stringify(productRow),
    },
  );

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data: data?.[0] ? toMarketplaceProduct(data[0]) : product });
}

export async function DELETE(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const guard = await assertAdmin();

  if (guard) {
    return guard;
  }

  const { slug } = await context.params;
  const { error } = await supabaseAdminRequest<unknown[]>(`/rest/v1/products?slug=eq.${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
