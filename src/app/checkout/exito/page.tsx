import SiteShell from "@/components/site-shell";
import CheckoutSuccessClient from "@/components/checkout-success-client";

type CheckoutSuccessPageProps = {
  searchParams?: Promise<{
    external_reference?: string;
    payment_id?: string;
    collection_id?: string;
  }>;
};

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const params = await searchParams;

  return (
    <SiteShell
      eyebrow="Checkout"
      title="Resultado de tu pago"
      subtitle="Consultamos tu orden en tiempo real para mostrarte un comprobante canónico de compra."
    >
      <CheckoutSuccessClient
        externalReference={params?.external_reference}
        paymentId={params?.payment_id ?? params?.collection_id}
      />
    </SiteShell>
  );
}
