import AddressBookClient from "@/components/address-book-client";
import SiteShell from "@/components/site-shell";

export default function AccountAddressesPage() {
  return (
    <SiteShell
      eyebrow="Mi cuenta"
      title="Mis direcciones"
      subtitle="Administra tus direcciones de entrega para acelerar el proceso de compra y evitar capturas repetidas en cada pedido."
    >
      <AddressBookClient />
    </SiteShell>
  );
}
