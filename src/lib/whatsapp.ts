const DEFAULT_WHATSAPP_NUMBER = "5520904940";

function toWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `52${digits}`;
  }

  return digits;
}

export function getWhatsAppHref(message: string) {
  const rawWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? DEFAULT_WHATSAPP_NUMBER;
  const whatsappNumber = toWhatsAppNumber(rawWhatsAppNumber);
  const whatsappMessage = encodeURIComponent(message);

  return `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
}
