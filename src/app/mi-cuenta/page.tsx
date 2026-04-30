import AccountDashboardClient from "@/components/account-dashboard-client";
import SiteShell from "@/components/site-shell";

export default function AccountDashboardPage() {
  return (
    <SiteShell
      eyebrow="Mi cuenta"
      title="Mi perfil"
      subtitle="Gestiona tus datos personales, consulta tus pedidos y administra tus direcciones guardadas desde un solo lugar."
    >
      <AccountDashboardClient />
    </SiteShell>
  );
}
