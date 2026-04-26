import SiteShell from "@/components/site-shell";
import CheckoutClient from "@/components/checkout-client";

export default function CheckoutPage() {
  return (
    <SiteShell
      eyebrow="Pago seguro"
      title="Checkout con tarjeta"
      subtitle="Procesa tu pago con Mercado Pago sin salir de ritualstudio.com.mx."
    >
      <CheckoutClient />
    </SiteShell>
  );
}
