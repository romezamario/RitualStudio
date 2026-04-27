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
  return process.env.EMAIL_FROM?.trim() || "";
}

function getSupportChannel() {
  return process.env.EMAIL_SUPPORT_CHANNEL?.trim() || "WhatsApp 55 2090 4940";
}

function formatPaidAt(rawDate: string) {
  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function buildPurchaseConfirmationTemplate(input: SendPurchaseConfirmationEmailInput) {
  const formattedDate = formatPaidAt(input.paidAt);
  const supportChannel = getSupportChannel();
  const safeExternalReference = escapeHtml(input.externalReference);
  const safePaymentId = escapeHtml(input.paymentId);
  const safeSupportChannel = escapeHtml(supportChannel);
  const safeTo = escapeHtml(input.to);

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
        <p style="margin:0 0 18px;"><strong>Fecha (UTC):</strong> ${escapeHtml(formattedDate)}</p>

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
        <p style="margin:0;color:#5f5751;">Comprobante enviado a: ${safeTo}</p>
      </div>
    `,
    text: `Gracias por confiar en Ritual Studio.

Recibimos tu pago con éxito.
Folio / referencia: ${input.externalReference}
ID de pago: ${input.paymentId}
Fecha (UTC): ${formattedDate}

Detalle de productos:
${itemsRowsText}

Total pagado: ${toCurrency(input.totalAmount)}
Canal de soporte: ${supportChannel}
Comprobante enviado a: ${input.to}`,
  };
}

async function sendWithResend(input: SendPurchaseConfirmationEmailInput): Promise<SendPurchaseConfirmationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from = getEmailFrom();

  if (!apiKey || !from) {
    return {
      ok: false,
      provider: "resend",
      error: "Faltan variables RESEND_API_KEY o EMAIL_FROM para enviar correo.",
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

