import SiteShell from "@/components/site-shell";
import AdminProductsManager from "@/components/admin-products-manager";

export default function AdminProductsPage() {
  return (
    <SiteShell
      eyebrow="Administrador"
      title="Gestión de productos"
      subtitle="Da de alta y edita productos del marketplace con nombre, descripción, foto, precio y oferta."
    >
      <AdminProductsManager />
    </SiteShell>
  );
}
