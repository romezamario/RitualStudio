import { marketplaceProducts } from "@/data/marketplace-products";

export type CheckoutLineItemInput = {
  slug: string;
  quantity: number;
};

export type ValidatedLineItem = {
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type MpCreateOrderInput = {
  token: string;
  payment_method_id: string;
  payment_method_type?: string;
  installments: number;
  payer: {
    email: string;
  };
  items: CheckoutLineItemInput[];
};

export type MpOrderResponse = {
  id?: string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transactions?: {
    payments?: Array<{
      id?: string | number;
      status?: string;
      status_detail?: string;
      payment_method?: {
        id?: string;
        type?: string;
      };
      amount?: number;
    }>;
  };
  [key: string]: unknown;
};

const MP_API_BASE = "https://api.mercadopago.com";

export function getMercadoPagoPublicKey() {
  return process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() ?? "";
}

export function getMercadoPagoAccessToken() {
  return process.env.MP_ACCESS_TOKEN?.trim() ?? "";
}

export function getMercadoPagoWebhookSecret() {
  return process.env.MP_WEBHOOK_SECRET?.trim() ?? "";
}

export function parseMxPrice(priceLabel: string): number {
  const clean = priceLabel.replace(/\s/g, "");
  const match = clean.match(/(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/);

  if (!match?.[0]) {
    throw new Error(`No fue posible obtener un precio numérico desde: ${priceLabel}`);
  }

  return Number(match[0].replace(/,/g, ""));
}

export function validateAndPriceLineItems(items: CheckoutLineItemInput[]): {
  lineItems: ValidatedLineItem[];
  totalAmount: number;
} {
  if (!Array.isArray(items) || !items.length) {
    throw new Error("Debes enviar al menos un producto para procesar el pago.");
  }

  const lineItems = items.map((entry) => {
    const product = marketplaceProducts.find((item) => item.slug === entry.slug);

    if (!product) {
      throw new Error(`Producto inválido: ${entry.slug}`);
    }

    if (!Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 10) {
      throw new Error(`Cantidad inválida para ${entry.slug}.`);
    }

    const unitPrice = parseMxPrice(product.price);
    const subtotal = unitPrice * entry.quantity;

    return {
      slug: product.slug,
      name: product.name,
      unitPrice,
      quantity: entry.quantity,
      subtotal,
    };
  });

  const totalAmount = lineItems.reduce((sum, item) => sum + item.subtotal, 0);

  if (!totalAmount || Number.isNaN(totalAmount)) {
    throw new Error("No fue posible calcular el total de la orden.");
  }

  return {
    lineItems,
    totalAmount,
  };
}

export async function mpApiFetch<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const accessToken = init.accessToken ?? getMercadoPagoAccessToken();

  if (!accessToken) {
    throw new Error("MP_ACCESS_TOKEN no está configurado.");
  }

  const response = await fetch(`${MP_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    const errorMessage =
      (data as { message?: string } | null)?.message ?? `Mercado Pago respondió con ${response.status}.`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export function mapPaymentStatus(status: string | undefined) {
  if (status === "approved") {
    return "approved";
  }

  if (status === "in_process" || status === "pending") {
    return "pending";
  }

  if (status === "rejected" || status === "cancelled") {
    return "rejected";
  }

  return "error";
}
