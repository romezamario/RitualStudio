import AccountDashboardClient from "@/components/account-dashboard-client";
import SiteShell from "@/components/site-shell";

export default function AccountDashboardPage() {
  return (
    <SiteShell
      eyebrow="Mi cuenta"
      title="Dashboard del usuario"
      subtitle="Desde aquí puedes revisar tu información general, pedidos y direcciones guardadas en un solo lugar."
    >
      <AccountDashboardClient />
    </SiteShell>
  );
}
