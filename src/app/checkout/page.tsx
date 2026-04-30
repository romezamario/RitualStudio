import SiteShell from "@/components/site-shell";
import CheckoutClient from "@/components/checkout-client";

export default function CheckoutPage() {
  const mercadoPagoPublicKey = process.env.MP_PUBLIC_KEY_PROD?.trim() ?? "";
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
