import SiteShell from "@/components/site-shell";
import CartPageClient from "@/components/cart-page-client";

export default function CarritoPage() {
  return (
    <SiteShell
      eyebrow="Marketplace Ritual Studio"
      title="Carrito de compras"
      subtitle="Revisa tus productos seleccionados y finaliza tu compra con checkout embebido con tarjeta o por WhatsApp."
    >
      <CartPageClient />
    </SiteShell>
  );
}
