type PurchaseItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type SendPurchaseConfirmationEmailInput = {
  to: string;
  externalReference: string;
  paymentId: string;
  paidAt: string;
  totalAmount: number;
  items: PurchaseItem[];
};

type SendPurchaseConfirmationEmailResult = {
  ok: boolean;
  skipped?: boolean;
  provider: string;
  messageId?: string;
  error?: string;
};

import { formatDateTimeMx } from "@/lib/date-time";

const DEFAULT_PROVIDER = "resend";

function toCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getEmailProvider() {
  return process.env.EMAIL_PROVIDER?.trim().toLowerCase() || DEFAULT_PROVIDER;
}

function getEmailFrom() {
  return process.env.RESEND_FROM_EMAIL?.trim() || process.env.EMAIL_FROM?.trim() || "";
}

function getSupportChannel() {
  return process.env.EMAIL_SUPPORT_CHANNEL?.trim() || "WhatsApp 81 8090 3028";
}

function getSiteUrl() {
  return process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
}

function getAccountOrdersUrl() {
  const explicitUrl = process.env.EMAIL_ACCOUNT_ORDERS_URL?.trim();

  if (explicitUrl) return explicitUrl;

  const siteUrl = getSiteUrl();
  if (!siteUrl) return "";

  return `${siteUrl.replace(/\/$/, "")}/mi-cuenta/pedidos`;
}

function getSocialLinks() {
  const defaultInstagramUrl = "https://www.instagram.com/ritualstudiomx?igsh=aTFiZmFjbnAxODkz";
  return [
    { label: "Instagram", url: process.env.EMAIL_SOCIAL_INSTAGRAM_URL?.trim() || defaultInstagramUrl },
    { label: "Facebook", url: process.env.EMAIL_SOCIAL_FACEBOOK_URL?.trim() || "" },
    { label: "TikTok", url: process.env.EMAIL_SOCIAL_TIKTOK_URL?.trim() || "" },
  ].filter((social) => social.url);
}

function formatPaidAt(rawDate: string) {
  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }

  return formatDateTimeMx(date, {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function buildPurchaseConfirmationTemplate(input: SendPurchaseConfirmationEmailInput) {
  const formattedDate = formatPaidAt(input.paidAt);
  const supportChannel = getSupportChannel();
  const siteUrl = getSiteUrl();
  const ordersUrl = getAccountOrdersUrl();
  const socialLinks = getSocialLinks();

  const safeExternalReference = escapeHtml(input.externalReference);
  const safePaymentId = escapeHtml(input.paymentId);
  const safeSupportChannel = escapeHtml(supportChannel);
  const safeTo = escapeHtml(input.to);
  const safeSiteUrl = siteUrl ? escapeHtml(siteUrl) : "";
  const safeOrdersUrl = ordersUrl ? escapeHtml(ordersUrl) : "";

  const calloutBoxStyle = "background:#fff;border:1px solid #e7ded7;border-radius:10px;padding:14px 16px;margin:0 0 14px;";

  const itemsRowsHtml = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e7ded7;">${escapeHtml(item.name)}</td>
          <td style="padding:8px;border-bottom:1px solid #e7ded7;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e7ded7;text-align:right;">${toCurrency(item.unitPrice)}</td>
          <td style="padding:8px;border-bottom:1px solid #e7ded7;text-align:right;">${toCurrency(item.subtotal)}</td>
        </tr>
      `
    )
    .join("");

  const itemsRowsText = input.items
    .map(
      (item) =>
        `- ${item.name} | Cantidad: ${item.quantity} | Unitario: ${toCurrency(item.unitPrice)} | Subtotal: ${toCurrency(item.subtotal)}`
    )
    .join("\n");

  const socialLinksHtml = socialLinks
    .map((social) => `<a href="${escapeHtml(social.url)}" style="color:#2f2925;text-decoration:none;">${escapeHtml(social.label)}</a>`)
    .join(" · ");

  const socialLinksText = socialLinks.map((social) => `${social.label}: ${social.url}`).join(" | ");

  return {
    subject: `Comprobante de compra Ritual Studio · ${input.externalReference}`,
    html: `
      <div style="font-family:Georgia,serif;background:#f6f1ed;padding:24px;color:#2f2925;">
        <h1 style="margin:0 0 12px;font-size:24px;">Gracias por confiar en Ritual Studio</h1>
        <p style="margin:0 0 16px;line-height:1.5;">
          Hola, recibimos tu pago con éxito y honramos este nuevo ciclo floral contigo.
        </p>
        <p style="margin:0 0 12px;"><strong>Folio / referencia:</strong> ${safeExternalReference}</p>
        <p style="margin:0 0 12px;"><strong>ID de pago:</strong> ${safePaymentId}</p>
        <p style="margin:0 0 18px;"><strong>Fecha (hora de México):</strong> ${escapeHtml(formattedDate)}</p>

        <div style="${calloutBoxStyle}">
          <p style="margin:0 0 8px;"><strong>Resumen rápido</strong></p>
          <p style="margin:0;line-height:1.5;">Tu pago ya fue acreditado y nuestro equipo comenzará a preparar tu pedido. Conserva este folio para cualquier aclaración.</p>
        </div>

        <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e7ded7;">
          <thead>
            <tr style="background:#efe5de;">
              <th style="padding:8px;text-align:left;">Producto</th>
              <th style="padding:8px;text-align:center;">Cantidad</th>
              <th style="padding:8px;text-align:right;">Precio</th>
              <th style="padding:8px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>

        <p style="margin:18px 0 8px;font-size:18px;"><strong>Total pagado: ${toCurrency(input.totalAmount)}</strong></p>
        <p style="margin:0 0 8px;">Canal de soporte: ${safeSupportChannel}</p>
        <p style="margin:0 0 8px;color:#5f5751;">Comprobante enviado a: ${safeTo}</p>
        ${safeOrdersUrl || safeSiteUrl ? `<div style="${calloutBoxStyle}">
          <p style="margin:0 0 8px;"><strong>Siguientes pasos</strong></p>
          ${safeOrdersUrl ? `<p style="margin:0 0 6px;"><a href="${safeOrdersUrl}" style="color:#2f2925;">Revisar mis compras</a></p>` : ""}
          ${safeSiteUrl ? `<p style="margin:0;"><a href="${safeSiteUrl}" style="color:#2f2925;">Visitar Ritual Studio</a></p>` : ""}
        </div>` : ""}
        <p style="margin:10px 0 0;color:#5f5751;">${socialLinksHtml ? `Síguenos: ${socialLinksHtml}` : "Pronto recibirás actualizaciones de tu pedido por este medio."}</p>
      </div>
    `,
    text: `Gracias por confiar en Ritual Studio.

Recibimos tu pago con éxito.
Folio / referencia: ${input.externalReference}
ID de pago: ${input.paymentId}
Fecha (hora de México): ${formattedDate}

Detalle de productos:
${itemsRowsText}

Total pagado: ${toCurrency(input.totalAmount)}
Canal de soporte: ${supportChannel}
Comprobante enviado a: ${input.to}${ordersUrl ? `\nRevisar mis compras: ${ordersUrl}` : ""}${siteUrl ? `\nSitio oficial: ${siteUrl}` : ""}${socialLinksText ? `\nRedes sociales: ${socialLinksText}` : ""}`,
  };
}

async function sendWithResend(input: SendPurchaseConfirmationEmailInput): Promise<SendPurchaseConfirmationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from = getEmailFrom();

  if (!apiKey || !from) {
    return {
      ok: false,
      provider: "resend",
      error: "Faltan variables RESEND_API_KEY o RESEND_FROM_EMAIL para enviar correo (EMAIL_FROM queda como fallback legacy opcional).",
    };
  }

  const template = buildPurchaseConfirmationTemplate(input);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    }),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

  if (!response.ok) {
    return {
      ok: false,
      provider: "resend",
      error: body?.message ?? `Resend respondió con estado ${response.status}.`,
    };
  }

  return {
    ok: true,
    provider: "resend",
    messageId: body?.id,
  };
}

export async function sendPurchaseConfirmationEmail(
  input: SendPurchaseConfirmationEmailInput
): Promise<SendPurchaseConfirmationEmailResult> {
  const provider = getEmailProvider();

  if (provider === "disabled" || provider === "none") {
    return {
      ok: true,
      skipped: true,
      provider,
    };
  }

  if (provider === "resend") {
    return sendWithResend(input);
  }

  return {
    ok: false,
    provider,
    error: `Proveedor de correo no soportado: ${provider}.`,
  };
}
