import SiteShell from "@/components/site-shell";
import CheckoutClient from "@/components/checkout-client";
import { getPaymentMode } from "@/lib/payment-mode";
import { getMercadoPagoPublicKey } from "@/lib/mercadopago";

export default async function CheckoutPage() {
  const paymentMode = await getPaymentMode();
  const mercadoPagoPublicKey = getMercadoPagoPublicKey(paymentMode);
  return (
    <SiteShell
      eyebrow="Pago seguro"
      title="Checkout con tarjeta"
      subtitle="Procesa tu pago con Mercado Pago sin salir de ritualstudio.com.mx."
    >
      <CheckoutClient mercadoPagoPublicKey={mercadoPagoPublicKey} />
    </SiteShell>
  );
}
