import { NextResponse } from "next/server";
import { getSupabaseClientInfoHeader } from "@/lib/integration-metadata";
import { supabaseAdminRequest } from "@/lib/supabase-admin";
import { getServerSessionTokens } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

type AuthUserPayload = {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
};

type OrderClaimCandidate = {
  id: string;
  external_reference: string | null;
  customer_email: string | null;
  created_at: string;
};

type ClaimOrdersInput = {
  external_reference?: string;
};

type OrderClaimAuditInsert = {
  order_id: string;
  claimed_by_user_id: string;
  claim_method: string;
  customer_email: string;
  claim_reference: string | null;
};

const RECENT_REFERENCE_WINDOW_HOURS = 24;

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeExternalReference(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function getAuthenticatedUserWithVerification(accessToken: string) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      "X-Client-Info": getSupabaseClientInfoHeader(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as AuthUserPayload | null;
}

function isRecentIsoDate(isoDate: string, hoursWindow: number) {
  const createdAt = new Date(isoDate);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const maxAgeMs = hoursWindow * 60 * 60 * 1000;
  return Date.now() - createdAt.getTime() <= maxAgeMs;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as ClaimOrdersInput;
  const requestedExternalReference = normalizeExternalReference(payload.external_reference);

  const { accessToken } = await getServerSessionTokens();

  if (!accessToken) {
    return NextResponse.json({ error: "Debes iniciar sesión para vincular compras." }, { status: 401 });
  }

  const authUser = await getAuthenticatedUserWithVerification(accessToken);

  if (!authUser?.id || !authUser.email) {
    return NextResponse.json({ error: "No fue posible validar tu sesión actual." }, { status: 401 });
  }

  if (!authUser.email_confirmed_at) {
    return NextResponse.json(
      { error: "Debes confirmar tu correo antes de vincular compras a tu cuenta." },
      { status: 403 }
    );
  }

  const normalizedEmail = normalizeEmail(authUser.email);

  const { data: guestOrders, error: guestOrdersError } = await supabaseAdminRequest<OrderClaimCandidate[]>(
    `/rest/v1/orders?select=id,external_reference,customer_email,created_at&user_id=is.null&order=created_at.desc&limit=200`
  );

  if (guestOrdersError) {
    return NextResponse.json({ error: guestOrdersError }, { status: 500 });
  }

  const matchingGuestOrders = (guestOrders ?? []).filter(
    (order) => normalizeEmail(order.customer_email) === normalizedEmail
  );

  if (requestedExternalReference) {
    const hasRecentOwnershipProof = matchingGuestOrders.some(
      (order) =>
        order.external_reference?.trim() === requestedExternalReference &&
        isRecentIsoDate(order.created_at, RECENT_REFERENCE_WINDOW_HOURS)
    );

    if (!hasRecentOwnershipProof) {
      return NextResponse.json(
        {
          error:
            "No pudimos validar la referencia reciente de checkout para vincular compras. Vuelve desde la pantalla de confirmación de compra.",
        },
        { status: 403 }
      );
    }
  }

  if (!matchingGuestOrders.length) {
    return NextResponse.json({
      linked_orders: 0,
      message: "No encontramos compras pendientes para vincular con tu correo verificado.",
    });
  }

  const idsList = matchingGuestOrders.map((order) => order.id).join(",");

  const { data: updatedOrders, error: updateError } = await supabaseAdminRequest<Array<{ id: string }>>(
    `/rest/v1/orders?id=in.(${idsList})&user_id=is.null`,
    {
      method: "PATCH",
      body: JSON.stringify({ user_id: authUser.id }),
    }
  );

  if (updateError) {
    return NextResponse.json({ error: updateError }, { status: 500 });
  }

  const linkedOrderIds = updatedOrders?.map((order) => order.id) ?? [];

  if (linkedOrderIds.length) {
    const auditRows: OrderClaimAuditInsert[] = linkedOrderIds.map((orderId) => ({
      order_id: orderId,
      claimed_by_user_id: authUser.id as string,
      claim_method: requestedExternalReference ? "verified_email+checkout_reference" : "verified_email",
      customer_email: normalizedEmail,
      claim_reference: requestedExternalReference,
    }));

    const { error: auditError } = await supabaseAdminRequest<unknown[]>("/rest/v1/order_claim_events", {
      method: "POST",
      body: JSON.stringify(auditRows),
    });

    if (auditError) {
      console.error("[auth/claim-orders] No se pudo registrar auditoría de vinculación:", auditError);
    }
  }

  return NextResponse.json({
    linked_orders: linkedOrderIds.length,
    message:
      linkedOrderIds.length > 0
        ? `Vinculamos ${linkedOrderIds.length} compra(s) a tu cuenta.`
        : "No encontramos compras pendientes para vincular con tu correo verificado.",
  });
}
