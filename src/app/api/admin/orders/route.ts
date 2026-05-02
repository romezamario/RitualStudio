import { NextResponse } from "next/server";
import { sendOrderStatusEmail } from "@/lib/email";
import { supabaseAdminRequest } from "@/lib/supabase-admin";
import { getCurrentUserProfile } from "@/lib/supabase/server";

type DeliveryStatus = "por_entregar" | "en_reparto" | "entregado";

type OrderRow = {
  id: string;
  external_reference: string;
  customer_email: string | null;
  created_at: string;
  total_amount: number;
  status: string;
  metadata: { mixed_items_summary?: { products?: Array<{ name?: string; quantity?: number }> } } | null;
};

async function assertAdmin() {
  const { user, isAdmin } = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  return null;
}

function hasProducts(order: OrderRow) {
  return (order.metadata?.mixed_items_summary?.products ?? []).length > 0;
}

function normalizeDeliveryStatus(value: string): DeliveryStatus {
  const normalized = value.trim().toLowerCase();
  if (["por_entregar", "en_reparto", "entregado"].includes(normalized)) {
    return normalized as DeliveryStatus;
  }

  if (normalized === "pending" || normalized === "approved") return "por_entregar";

  return "por_entregar";
}

export async function GET() {
  const guard = await assertAdmin();
  if (guard) return guard;

  const query =
    "/rest/v1/orders?select=id,external_reference,customer_email,created_at,total_amount,status,metadata&order=created_at.desc&limit=200";
  const { data, error } = await supabaseAdminRequest<OrderRow[]>(query, { method: "GET" });

  if (error) return NextResponse.json({ error }, { status: 500 });

  const orders = (data ?? []).map((order) => ({
    ...order,
    delivery_status: normalizeDeliveryStatus(order.status),
    has_products: hasProducts(order),
  }));

  return NextResponse.json({ data: orders });
}

export async function PATCH(request: Request) {
  const guard = await assertAdmin();
  if (guard) return guard;

  const body = (await request.json().catch(() => null)) as { orderId?: string; status?: DeliveryStatus } | null;

  if (!body?.orderId || !body?.status) {
    return NextResponse.json({ error: "Debes indicar orderId y status." }, { status: 400 });
  }

  if (!["por_entregar", "en_reparto", "entregado"].includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const { data: orderRows, error: orderError } = await supabaseAdminRequest<OrderRow[]>(
    `/rest/v1/orders?select=id,external_reference,customer_email,created_at,total_amount,status,metadata&id=eq.${encodeURIComponent(body.orderId)}&limit=1`,
    { method: "GET" },
  );

  if (orderError) return NextResponse.json({ error: orderError }, { status: 500 });

  const order = orderRows?.[0];
  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });

  const { error: updateError } = await supabaseAdminRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(body.orderId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: body.status }),
  });

  if (updateError) return NextResponse.json({ error: updateError }, { status: 500 });

  const statusChanged = normalizeDeliveryStatus(order.status) !== body.status;
  if (statusChanged && hasProducts(order) && order.customer_email && (body.status === "en_reparto" || body.status === "entregado")) {
    const emailResult = await sendOrderStatusEmail({
      to: order.customer_email,
      externalReference: order.external_reference,
      status: body.status,
    });

    if (!emailResult.ok) {
      console.error("[admin/orders] No se pudo enviar correo de estado:", emailResult.error);
    }
  }

  return NextResponse.json({ ok: true });
}
