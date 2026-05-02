import { marketplaceProducts } from "@/data/marketplace-products";
import { fetchMarketplaceProductsFromBackend } from "@/lib/marketplace-catalog";
import { supabaseAdminRequest } from "@/lib/supabase-admin";
import { validateMercadoPagoEnv } from "@/lib/mercadopago-env";

export type CheckoutLineItemInput =
  | {
      kind?: "product";
      slug: string;
      quantity: number;
    }
  | {
      kind: "course";
      slug: string;
      course_session_id: string;
      quantity: number;
      course_participants?: string[];
    };

export type ValidatedLineItem = {
  kind: "product" | "course";
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  courseId?: string;
  courseSessionId?: string;
  sessionStartsAt?: string;
};

export type CourseParticipantsBySession = Record<string, string[]>;

export type MpCreateOrderInput = {
  token: string;
  payment_method_id: string;
  payment_method_type?: string;
  installments: number;
  issuer_id?: string | number;
  payer: {
    email: string;
  };
  receipt_email?: string;
  items: CheckoutLineItemInput[];
  course_participants?: CourseParticipantsBySession;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  price: number;
  is_active: boolean;
};

type CourseSessionRow = {
  id: string;
  course_id: string;
  starts_at: string;
  capacity: number;
  reserved_spots: number;
  is_active: boolean;
};

export type MpPaymentResponse = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  transaction_amount?: number;
  order?: {
    id?: string | number;
  };
  [key: string]: unknown;
};

type MercadoPagoSdkModule = {
  MercadoPagoConfig: new (options: { accessToken: string }) => unknown;
  Payment: new (client: unknown) => {
    create?: (input: { body: Record<string, unknown>; requestOptions?: Record<string, unknown> }) => Promise<unknown>;
    get?: (input: { id: string }) => Promise<unknown>;
    search?: (input: { options: Record<string, unknown> }) => Promise<unknown>;
  };
};

const MP_API_BASE = "https://api.mercadopago.com";
export const MIN_MX_CARD_PAYMENT_AMOUNT = 10;
const MAX_PRODUCT_QUANTITY_PER_LINE = 10;
const MAX_COURSE_PARTICIPANTS_PER_LINE = 6;

export function getMercadoPagoPublicKey(environment: "prod" | "test" = "prod") {
  const envVarName = environment === "test" ? "MP_PUBLIC_KEY_TEST" : "MP_PUBLIC_KEY_PROD";
  return process.env[envVarName]?.trim() ?? "";
}

export function getMercadoPagoAccessToken(environment: "prod" | "test" = "prod") {
  const envVarName = environment === "test" ? "MP_ACCESS_TOKEN_TEST" : "MP_ACCESS_TOKEN_PROD";
  const rawToken = process.env[envVarName]?.trim() ?? "";
  return sanitizeMercadoPagoToken(rawToken);
}

function sanitizeMercadoPagoToken(rawToken: string) {

  if (!rawToken) {
    return "";
  }

  const withoutQuotes = rawToken.replace(/^['"]|['"]$/g, "");
  const withoutBom = withoutQuotes.replace(/^\uFEFF/, "");
  const withoutBearer = withoutBom.replace(/^Bearer[:\s]+/i, "").trim();
  return withoutBearer;
}

export function getMercadoPagoWebhookSecret(environment: "prod" | "test" = "prod") {
  const envVarName = environment === "test" ? "MP_WEBHOOK_SECRET_TEST" : "MP_WEBHOOK_SECRET_PROD";
  return process.env[envVarName]?.trim() ?? "";
}

export function getMercadoPagoAccessTokenByEnvironment(environment: "prod" | "test") {
  const envVarName = environment === "test" ? "MP_ACCESS_TOKEN_TEST" : "MP_ACCESS_TOKEN_PROD";
    return sanitizeMercadoPagoToken(process.env[envVarName]?.trim() ?? "");
}

export function getMercadoPagoWebhookSecretByEnvironment(environment: "prod" | "test") {
  const envVarName = environment === "test" ? "MP_WEBHOOK_SECRET_TEST" : "MP_WEBHOOK_SECRET_PROD";
    return process.env[envVarName]?.trim() ?? "";
}

export function parseMxPrice(priceLabel: string): number {
  
  const clean = priceLabel.replace(/\s/g, "");
  const match = clean.match(/(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/);

  if (!match?.[0]) {
    throw new Error(`No fue posible obtener un precio numérico desde: ${priceLabel}`);
  }

  return Number(match[0].replace(/,/g, ""));
}

async function getCheckoutCatalog() {
  const backendProducts = await fetchMarketplaceProductsFromBackend();

  if (backendProducts && backendProducts.length > 0) {
    return backendProducts;
  }

  return marketplaceProducts;
}

async function validateCourseLineItem(entry: Extract<CheckoutLineItemInput, { kind: "course" }>) {
  if (!entry.course_session_id || !entry.slug) {
    throw new Error("Curso inválido: faltan datos de sesión.");
  }

  if (!Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > MAX_COURSE_PARTICIPANTS_PER_LINE) {
    throw new Error(`Cantidad inválida para curso ${entry.slug}.`);
  }

  const { data: sessionData, error: sessionError } = await supabaseAdminRequest<CourseSessionRow[]>(
    `/rest/v1/course_sessions?id=eq.${encodeURIComponent(entry.course_session_id)}&is_active=eq.true&select=id,course_id,starts_at,capacity,reserved_spots,is_active&limit=1`,
    { method: "GET" },
  );

  if (sessionError || !sessionData?.length) {
    throw new Error(`Sesión inválida para curso ${entry.slug}.`);
  }

  const session = sessionData[0];
  const { data: courseData, error: courseError } = await supabaseAdminRequest<CourseRow[]>(
    `/rest/v1/courses?id=eq.${encodeURIComponent(session.course_id)}&slug=eq.${encodeURIComponent(entry.slug)}&is_active=eq.true&select=id,slug,title,price,is_active&limit=1`,
    { method: "GET" },
  );

  if (courseError || !courseData?.length) {
    throw new Error(`Curso inválido: ${entry.slug}.`);
  }

  const course = courseData[0];
  const remainingSpots = Math.max(session.capacity - session.reserved_spots, 0);

  if (entry.quantity > remainingSpots) {
    throw new Error(`Cupo insuficiente para ${entry.slug}. Disponibles: ${remainingSpots}.`);
  }

  const unitPrice = Number(course.price);
  const subtotal = unitPrice * entry.quantity;

  return {
    kind: "course" as const,
    slug: course.slug,
    name: course.title,
    unitPrice,
    quantity: entry.quantity,
    subtotal,
    courseId: course.id,
    courseSessionId: session.id,
    sessionStartsAt: session.starts_at,
  };
}

export async function validateAndPriceLineItems(items: CheckoutLineItemInput[]): Promise<{
  lineItems: ValidatedLineItem[];
  totalAmount: number;
}> {
  if (!Array.isArray(items) || !items.length) {
    throw new Error("Debes enviar al menos un ítem para procesar el pago.");
  }

  const checkoutCatalog = await getCheckoutCatalog();
  const catalogByNormalizedSlug = new Map(checkoutCatalog.map((product) => [normalizeSlug(product.slug), product]));

  const lineItems = await Promise.all(
    items.map(async (entry) => {
      if (entry.kind === "course") {
        return validateCourseLineItem(entry);
      }

      const rawSlug = typeof entry.slug === "string" ? entry.slug : "";
      const normalizedSlug = normalizeSlug(rawSlug);
      const product = catalogByNormalizedSlug.get(normalizedSlug);

      if (!product) {
        throw new Error(
          `Producto inválido: ${rawSlug}. El checkout envía slugs y este valor no existe en el catálogo actual.`,
        );
      }

      if (!Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > MAX_PRODUCT_QUANTITY_PER_LINE) {
        throw new Error(`Cantidad inválida para ${entry.slug}.`);
      }

      const unitPrice = parseMxPrice(product.price);
      const subtotal = unitPrice * entry.quantity;

      return {
        kind: "product" as const,
        slug: product.slug,
        name: product.name,
        unitPrice,
        quantity: entry.quantity,
        subtotal,
      };
    }),
  );

  const totalAmount = lineItems.reduce((sum, item) => sum + item.subtotal, 0);

  if (!totalAmount || Number.isNaN(totalAmount)) {
    throw new Error("No fue posible calcular el total de la orden.");
  }

  return {
    lineItems,
    totalAmount,
  };
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

export function validateMercadoPagoAmount(totalAmount: number) {
  if (Number.isNaN(totalAmount) || totalAmount <= 0) {
    throw new Error("No fue posible calcular el total de la orden.");
  }

  if (totalAmount < MIN_MX_CARD_PAYMENT_AMOUNT) {
    throw new Error(`El monto mínimo para pagar con tarjeta en este checkout es de $${MIN_MX_CARD_PAYMENT_AMOUNT} MXN.`);
  }
}

export async function mpApiFetch<T>(
  path: string,
  init: RequestInit & { accessToken?: string; environment?: "prod" | "test" } = {},
): Promise<T> {
  const environment = init.environment ?? "prod";
  const accessToken = init.accessToken ?? getMercadoPagoAccessToken(environment);
  const publicKey = getMercadoPagoPublicKey(environment);

  if (!accessToken) {
    throw new Error("MP_ACCESS_TOKEN_PROD no está configurado.");
  }

  validateMercadoPagoEnv({
    publicKey,
    accessToken,
  });

  const sdkData = await tryMercadoPagoSdkRequest<T>({ path, init, accessToken });
  if (sdkData !== null) {
    return sdkData;
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

  const data = (await response.json().catch(() => null)) as
    | T
    | {
        message?: string;
        error?: string;
        cause?: Array<{ code?: string; description?: string }>;
      }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        environment === "test"
          ? "Mercado Pago respondió con 401 (Unauthorized). Revisa MP_ACCESS_TOKEN_TEST en Vercel: debe ser Access Token válido, sin prefijo 'Bearer', y del mismo entorno que MP_PUBLIC_KEY_TEST."
          : "Mercado Pago respondió con 401 (Unauthorized). Revisa MP_ACCESS_TOKEN_PROD en Vercel: debe ser Access Token válido, sin prefijo 'Bearer', y del mismo entorno que MP_PUBLIC_KEY_PROD.",
      );
    }

    const errorData = data as
      | {
          message?: string;
          error?: string;
          cause?: Array<{ code?: string; description?: string }>;
        }
      | null;

    const causeDetails = errorData?.cause
      ?.map((cause) => [cause.code, cause.description].filter(Boolean).join(": "))
      .filter(Boolean)
      .join(" | ");

    const mpRequestId = response.headers.get("x-request-id") ?? response.headers.get("x-idempotency-key") ?? null;
    const baseMessage = errorData?.message ?? errorData?.error ?? "Error desconocido";
    const errorPrefix = `Mercado Pago respondió con ${response.status}`;
    const errorCore = causeDetails ? `${baseMessage} (${causeDetails})` : baseMessage;
    const errorWithRequest = mpRequestId
      ? `${errorPrefix}: ${errorCore}. request_id=${mpRequestId}`
      : `${errorPrefix}: ${errorCore}`;
    const errorMessage = errorWithRequest;
    throw new Error(errorMessage);
  }

  return data as T;
}

async function tryMercadoPagoSdkRequest<T>({
  path,
  init,
  accessToken,
}: {
  path: string;
  init: RequestInit;
  accessToken: string;
}): Promise<T | null> {
  if (!path.startsWith("/v1/payments")) {
    return null;
  }

  let sdk: MercadoPagoSdkModule | null = null;
  try {
    sdk = (await import("mercadopago")) as MercadoPagoSdkModule;
  } catch {
    return null;
  }

  const client = new sdk.MercadoPagoConfig({ accessToken });
  const paymentApi = new sdk.Payment(client);
  const method = (init.method ?? "GET").toUpperCase();

  if (method === "POST" && path === "/v1/payments" && paymentApi.create) {
    const body = init.body && typeof init.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : {};
    const response = await paymentApi.create({
      body,
      requestOptions: extractMercadoPagoRequestOptions(init.headers),
    });
    return response as T;
  }

  const paymentByIdMatch = path.match(/^\/v1\/payments\/([^/?#]+)/);
  if (method === "GET" && paymentByIdMatch && paymentApi.get) {
    const response = await paymentApi.get({ id: decodeURIComponent(paymentByIdMatch[1]) });
    return response as T;
  }

  if (method === "GET" && path.startsWith("/v1/payments/search")) {
    return null;
  }

  return null;
}

function extractMercadoPagoRequestOptions(headers: RequestInit["headers"]): Record<string, unknown> | undefined {
  const resolvedHeaders = new Headers(headers ?? {});
  const idempotencyKey = resolvedHeaders.get("X-Idempotency-Key") ?? resolvedHeaders.get("x-idempotency-key");

  if (!idempotencyKey) {
    return undefined;
  }

  return {
    idempotencyKey,
  };
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
